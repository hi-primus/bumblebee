<template>
  <NuxtLayout class="p-4">
    <div class="manager-header">
      <AppButton
        class="layout-invisible icon-button size-large color-neutral -ml-2"
        type="button"
        :icon="mdiArrowLeft"
        :to="{
          name: `projects-projectId-workspaces`,
          params: { projectId: route.params.projectId }
        }"
      />
      <h1>Edit Workspace Info</h1>
    </div>
    <form class="manager-form" @submit.prevent="saveProject">
      <AppInput v-model="workspaceName" type="text" label="Workspace Name" />
      <AppInput
        v-model="workspaceDescription"
        type="textarea"
        label="Workspace Description"
      />
      <AppButton class="self-center" type="submit"> Save Workspace </AppButton>
    </form>
  </NuxtLayout>
</template>
<script setup lang="ts">
import { mdiArrowLeft } from '@mdi/js';

import { GET_WORKSPACE_INFO, UPDATE_WORKSPACE_INFO } from '@/api/queries';

const workspaceName = ref('');
const workspaceDescription = ref('');

const route = useRoute();

const queryResult = useClientQuery(GET_WORKSPACE_INFO, {
  id: route.params.workspaceId
});

// Watch for changes in result and update the input fields
watch(
  queryResult.result,
  newValue => {
    console.log(
      '[DEBUG] Workspace description',
      newValue?.workspaces_by_pk?.description
    );
    if (newValue?.workspaces_by_pk) {
      workspaceName.value = newValue.workspaces_by_pk.name;
      workspaceDescription.value = newValue.workspaces_by_pk.description;
    }
  },
  { immediate: true }
);

const { mutate: updateProjectMutation } = useMutation(UPDATE_WORKSPACE_INFO);

async function saveProject() {
  await updateProjectMutation({
    id: route.params.workspaceId,
    name: workspaceName.value,
    description: workspaceDescription.value
  });
}
</script>
