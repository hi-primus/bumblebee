<template>
  <NuxtLayout class="manager-page">
    <div class="manager-header">
      <AppMenu
        container-class="ml-auto"
        :items="[
          {
            text: 'Connections',
            action: () =>
              navigateTo(`/projects/${route.params.projectId}/connections`)
          }
        ]"
      >
        <AppButton
          class="layout-invisible icon-button size-small color-neutral"
          type="button"
          :icon="mdiDotsVertical"
        />
      </AppMenu>
    </div>
    <div class="manager-header">
      <div class="manager-navigation flex-1">
        <NuxtLink class="title" to="/projects"> Projects </NuxtLink>
        <Icon class="chevron-icon" :path="mdiChevronRight" />
        <template v-if="projectName !== null">
          <EditableElement
            ref="projectNameElement"
            :model-value="projectName"
            class="title"
            @update:model-value="$event => updateProjectName($event)"
          />
          <IconButton
            class="edit-icon"
            :path="mdiPencil"
            @click="$event => projectNameElement?.focusAndSelect()"
          />
        </template>
        <Icon v-else class="loading-icon" :path="mdiLoading" />
      </div>
      <AppButton class="creation-button" type="button" @click="createWorkspace">
        Create Workspace
      </AppButton>
    </div>
    <table class="data-table clickable w-full">
      <thead>
        <tr>
          <th>Status</th>
          <th>Name</th>
          <th>Created at</th>
          <th class="actions"></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="workspace in workspacesResult"
          :key="workspace.id"
          @click="
            workspace.access_level === 'Predictor'
              ? openPredict(workspace.id)
              : openWorkspace(workspace.id)
          "
        >
          <td>{{ !!workspace.id ? 'Active' : 'Inactive' }}</td>
          <td>{{ workspace.name }}</td>
          <td>
            {{
              new Date(workspace.created_at).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })
            }}
          </td>

          <td class="actions">
            <span>
              <!-- <AppButton
                class="size-small layout-invisible icon-button color-neutral"
                type="button"
                :to="'/projects/' + workspace.id + '/workspaces/'"
              >
                Duplicate
              </AppButton> -->
              <AppButton
                v-tooltip="'Delete workspace'"
                class="size-small layout-invisible icon-button color-neutral"
                type="button"
                :icon="mdiTrashCan"
                @click.stop="deleteWorkspace(workspace)"
              />

              <AppButton
                v-tooltip="'Go to workspace'"
                class="size-small layout-invisible icon-button color-neutral"
                type="button"
                :icon="mdiArrowRight"
                :to="{
                  name:
                    workspace.access_level === 'Predictor'
                      ? 'projects-projectId-workspaces-workspaceId-predict'
                      : 'projects-projectId-workspaces-workspaceId',
                  params: {
                    projectId: route.params.projectId,
                    workspaceId: workspace.id
                  }
                }"
              />
            </span>
          </td>
        </tr>
        <tr
          v-if="!workspacesQueryResult.result.value?.workspaces?.length"
          class="table-is-empty"
        >
          <td colspan="100">No workspaces found</td>
        </tr>
      </tbody>
    </table>
  </NuxtLayout>
</template>
<script setup>
import {
  mdiArrowRight,
  mdiChevronRight,
  mdiDotsVertical,
  mdiLoading,
  mdiPencil,
  mdiTrashCan
} from '@mdi/js';

import {
  CREATE_WORKSPACE,
  // DELETE_PROJECT,
  DELETE_WORKSPACE,
  GET_PROJECT,
  GET_WORKSPACES,
  UPDATE_PROJECT
} from '@/api/queries';

useHead({
  title: 'Bumblebee Workspaces'
});

const { confirm } = useConfirmPopup();

const userId = useUserId();
const route = useRoute();

const { addToast } = useToasts();

const projectName = ref(null);
const projectNameElement = ref(null);

const projectQueryResult = useClientQuery(GET_PROJECT, {
  id: route.params.projectId
});

const workspacesQueryResult = useClientQuery(GET_WORKSPACES, {
  user_id: userId.value,
  project_id: route.params.projectId
});

const workspacesResult = computed(() => {
  if (workspacesQueryResult.result.value) {
    return workspacesQueryResult.result.value.workspace_access.map(access => ({
      ...access.workspace_access_workspaces,
      access_level: access.access_level
    }));
  } else {
    return [];
  }
});

watch(
  projectQueryResult.result,
  newValue => {
    if (newValue?.projects_by_pk) {
      projectName.value = newValue.projects_by_pk.name;
    }
  },
  { immediate: true }
);

const { mutate: updateProjectMutation } = useMutation(UPDATE_PROJECT);

const updateProjectName = async newName => {
  if (projectName.value === newName) {
    return;
  }
  projectName.value = newName;
  await updateProjectMutation({
    id: route.params.projectId,
    name: newName
  });
  addToast({
    title: 'Project name updated',
    type: 'success'
  });
};

const {
  mutate: createWorkspaceMutation,
  onDone: onDoneCreateWorkspaceMutation
} = useMutation(CREATE_WORKSPACE);

const { mutate: deleteWorkspaceMutation, onDone: onDoneDeleteProjectMutation } =
  useMutation(DELETE_WORKSPACE);

const createWorkspace = () => {
  console.log('[DEBUG] Creating workspace');
  createWorkspaceMutation({
    project_id: route.params.projectId,
    name: 'Untitled Workspace',
    receiver_id: userId.value,
    sender_id: userId.value
  });
};

let deleting = false;

const deleteWorkspace = async workspace => {
  if (deleting) {
    return;
  }
  deleting = true;
  const result = await confirm(`Delete '${workspace.name}'?`);
  if (result) {
    deleteWorkspaceMutation({
      id: workspace.id
    });
  }
  deleting = false;
};

onDoneDeleteProjectMutation(() => {
  workspacesQueryResult.refetch();
});
onDoneCreateWorkspaceMutation(result => {
  navigateTo(
    `/projects/${route.params.projectId}/workspaces/${result.data.insert_workspaces_one.id}`
  );
});

const openPredict = id => {
  navigateTo(`/projects/${route.params.projectId}/workspaces/${id}/predict`);
};

const openWorkspace = id => {
  navigateTo(`/projects/${route.params.projectId}/workspaces/${id}`);
};

onMounted(() => {
  if (projectQueryResult.result.value) {
    projectQueryResult.refetch();
  }
  if (workspacesQueryResult.result.value) {
    workspacesQueryResult.refetch();
  }
});
</script>
