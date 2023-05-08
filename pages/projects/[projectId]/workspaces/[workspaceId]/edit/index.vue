<template>
  <NuxtLayout class="p-4">
    <AppButton
      class="layout-invisible icon-button size-large color-neutral -ml-2 -mt-2"
      type="button"
      :icon="mdiArrowLeft"
      :to="{
        name: `projects-projectId-workspaces`,
        params: { projectId: route.params.projectId }
      }"
    />
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

import { GET_WORKSPACE, UPDATE_WORKSPACE } from '@/api/queries';

const workspaceName = ref('');
const workspaceDescription = ref('');

const route = useRoute();

const queryResult = useClientQuery(GET_WORKSPACE, {
  id: route.params.workspace_id
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

const { mutate: updateProjectMutation } = useMutation(UPDATE_WORKSPACE);

async function saveProject() {
  await updateProjectMutation({
    id: route.params.workspace_id,
    name: workspaceName.value,
    description: workspaceDescription.value
  });
}
</script>
