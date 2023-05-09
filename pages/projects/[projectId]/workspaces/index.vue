<template>
  <NuxtLayout class="p-4">
    <div class="manager-header">
      <AppButton
        class="layout-invisible icon-button size-large color-neutral -ml-2"
        type="button"
        :icon="mdiArrowLeft"
        to="/projects"
      />
      <h1>Workspaces</h1>
      <AppMenu
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
    <form class="manager-form" @submit.prevent="createWorkspace">
      <AppInput v-model="workspaceName" type="text" label="Workspace Name" />
      <AppInput
        v-model="workspaceDescription"
        type="textarea"
        label="Workspace Description"
      />
      <AppButton class="self-center" type="submit">
        Create Workspace
      </AppButton>
    </form>
    <table class="data-table w-full">
      <thead>
        <tr>
          <th>Active</th>
          <th>Name</th>
          <th>Description</th>
          <th>Data Sources</th>
          <th>Last Modification</th>
          <th>Created at</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="workspace in queryResult.result.value?.workspaces"
          :key="workspace.id"
        >
          <td>{{ workspace.id }}</td>
          <td>{{ workspace.name }}</td>
          <td>{{ workspace.description }}</td>
          <td>{{ workspace.description }}</td>
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
              <AppButton
                class="size-smallest"
                type="button"
                :to="{
                  name: 'projects-projectId-workspaces-workspaceId',
                  params: {
                    projectId: route.params.projectId,
                    workspaceId: workspace.id
                  }
                }"
              >
                View
              </AppButton>

              <AppButton
                class="size-smallest"
                type="button"
                :to="{
                  name: 'projects-projectId-workspaces-workspaceId-edit',
                  params: {
                    projectId: route.params.projectId,
                    workspaceId: workspace.id
                  }
                }"
              >
                Edit
              </AppButton>
              <!-- <AppButton
                class="size-smallest"
                type="button"
                :to="'/projects/' + workspace.id + '/workspaces/'"
              >
                Duplicate
              </AppButton> -->
              <AppButton
                class="size-smallest"
                type="button"
                @click="deleteWorkspace(workspace.id)"
              >
                Delete
              </AppButton>
            </span>
          </td>
        </tr>
        <tr
          v-if="!queryResult.result.value?.workspaces?.length"
          class="table-is-empty"
        >
          <td colspan="100">No workspaces found</td>
        </tr>
      </tbody>
    </table>
  </NuxtLayout>
</template>
<script setup>
import { mdiArrowLeft, mdiDotsVertical } from '@mdi/js';

import {
  CREATE_WORKSPACE,
  // DELETE_PROJECT,
  DELETE_WORKSPACE,
  GET_WORKSPACES
} from '@/api/queries';

useHead({
  title: 'Bumblebee Workspaces'
});

const userId = useUserId();
const route = useRoute();

const queryResult = useClientQuery(GET_WORKSPACES, {
  user_id: userId.value,
  project_id: route.params.projectId
});

const {
  mutate: createWorkspaceMutation,
  onDone: onDoneCreateWorkspaceMutation
} = useMutation(CREATE_WORKSPACE);

const { mutate: deleteProjectMutation, onDone: onDoneDeleteProjectMutation } =
  useMutation(DELETE_WORKSPACE);

const createWorkspace = () => {
  console.log(
    '[DEBUG] Creating workspace',
    workspaceName.value,
    workspaceDescription.value
  );
  createWorkspaceMutation({
    project_id: route.params.projectId,
    name: workspaceName.value,
    description: workspaceDescription.value,
    receiver_id: userId.value,
    sender_id: userId.value
  });
};

const deleteWorkspace = id => {
  deleteProjectMutation({
    id
  });
};
onDoneDeleteProjectMutation(() => {
  queryResult.refetch();
});
onDoneCreateWorkspaceMutation(() => {
  workspaceName.value = '';
  workspaceDescription.value = '';
  queryResult.refetch();
});

const workspaceName = ref('');
const workspaceDescription = ref('');
</script>
