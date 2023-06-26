<template>
  <NuxtLayout class="relative h-screen flex flex-col">
    <Workspace
      v-if="workspaceQueryResult.result?.value?.workspaces_by_pk"
      class="border-line-light border-t"
      :data="workspaceQueryResult.result.value.workspaces_by_pk"
      @update:data="updateWorkspace"
    >
      <template #header>
        <div class="manager-header !text-lg pl-12 !mb-0 !pb-[2px]">
          <div class="manager-navigation flex-1 !mb-0">
            <NuxtLink class="title" to="/projects"> Projects </NuxtLink>
            <Icon class="chevron-icon" :path="mdiChevronRight" />
            <template
              v-if="
                projectQueryResult?.result?.value?.projects_by_pk?.name &&
                workspaceName
              "
            >
              <NuxtLink
                class="title"
                :to="`/projects/${route.params.projectId}/workspaces`"
              >
                {{ projectQueryResult?.result?.value?.projects_by_pk?.name }}
              </NuxtLink>
              <Icon class="chevron-icon" :path="mdiChevronRight" />
              <EditableElement
                ref="workspaceNameElement"
                :model-value="workspaceName"
                class="title"
                @update:model-value="$event => updateWorkspaceName($event)"
              />
              <IconButton
                class="edit-icon"
                :path="mdiPencil"
                @click="$event => workspaceNameElement?.focusAndSelect()"
              />
            </template>
            <Icon v-else class="loading-icon" :path="mdiLoading" />
          </div>
        </div>
      </template>
    </Workspace>
    <div
      v-else
      class="absolute top-0 left-0 w-full h-full flex-1 flex flex-col items-center justify-center"
    >
      <Icon
        :path="mdiLoading"
        class="w-12 h-12 text-neutral-lighter animate-spin"
      />
      <span class="font-bold text-lg text-neutral-lighter">
        Loading workspace
      </span>
    </div>
  </NuxtLayout>
</template>
<script setup lang="ts">
import { mdiChevronRight, mdiLoading, mdiPencil } from '@mdi/js';

import {
  GET_PROJECT,
  GET_WORKSPACE,
  UPDATE_WORKSPACE,
  UPDATE_WORKSPACE_INFO
} from '@/api/queries';
import { Session, WorkspaceData } from '@/types/app';

const route = useRoute();

const { addToast } = useToasts();

const workspaceNameElement = ref(null);
const workspaceName = ref<string | null>(null);

const projectQueryResult = useClientQuery<{ projects_by_pk: { name: string } }>(
  GET_PROJECT,
  {
    id: route.params.projectId
  }
);

const workspaceQueryResult = useClientQuery<{
  workspaces_by_pk: WorkspaceData & { name: string };
}>(GET_WORKSPACE, {
  id: route.params.workspaceId
});

watch(
  workspaceQueryResult.result,
  newValue => {
    if (newValue?.workspaces_by_pk) {
      workspaceName.value = newValue.workspaces_by_pk.name;
    }
  }
  // { immediate: true }
);

const { mutate: updateWorkspaceMutation } = useMutation(UPDATE_WORKSPACE);

const { mutate: updateWorkspaceInfoMutation } = useMutation(
  UPDATE_WORKSPACE_INFO
);

let throttleTimer = null;

async function updateWorkspace({ commands, tabs }) {
  if (route.params.workspaceId !== workspaceQueryResult.result.value?.workspaces_by_pk?.id) {
    return;
  }

  // cancels any previous call but still finishes it if it's already called
  clearTimeout(throttleTimer);
  throttleTimer = setTimeout(() => updateWorkspaceThrottled({ commands, tabs }), 500);
}

const updateWorkspaceThrottled = async function ({ commands, tabs }) {

  await updateWorkspaceMutation({
    id: route.params.workspaceId,
    commands,
    tabs
  });

  console.log('Workspace updated');
};

const updateWorkspaceName = async (newName: string) => {
  if (workspaceName.value === newName) {
    return;
  }
  workspaceName.value = newName;
  await updateWorkspaceInfoMutation({
    id: route.params.workspaceId,
    name: newName
  });
  addToast({
    title: 'Workspace name updated',
    type: 'success'
  });
};

const session = computed<Session | null>(() => {
  const workspace = workspaceQueryResult.result.value?.workspaces_by_pk;
  const project = projectQueryResult.result.value?.projects_by_pk;
  return {
    workspace: {
      id: route.params.workspaceId,
      name: workspace?.name
    },
    project: {
      id: route.params.projectId,
      name: project?.name
    }
  };
});
provide('session', session);

onMounted(() => {
  if (projectQueryResult.result.value) {
    projectQueryResult.result.value = undefined;
    projectQueryResult.refetch();
  }
  if (workspaceQueryResult.result.value) {
    workspaceQueryResult.result.value = undefined;
    workspaceQueryResult.refetch();
  }
});
</script>
