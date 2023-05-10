<template>
  <NuxtLayout class="relative">
    <Workspace
      v-if="queryResult.result?.value?.workspaces_by_pk"
      :data="queryResult.result.value.workspaces_by_pk"
      @update:data="updateWorkspaceData"
    />
    <div
      v-else
      class="absolute top-0 left-0 w-full h-screen flex flex-col items-center justify-center"
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
import { mdiLoading } from '@mdi/js';

import { GET_WORKSPACE, UPDATE_WORKSPACE } from '@/api/queries';
import { WorkspaceData } from '@/types/app';

const route = useRoute();

const queryResult = useClientQuery<{ workspaces_by_pk: WorkspaceData }>(
  GET_WORKSPACE,
  {
    id: route.params.workspaceId
  }
);

const { mutate: updateWorkspace } = useMutation(UPDATE_WORKSPACE);

async function updateWorkspaceData({ commands, tabs }) {
  await updateWorkspace({
    id: route.params.workspaceId,
    commands,
    tabs
  });
}
</script>
