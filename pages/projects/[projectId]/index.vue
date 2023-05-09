<template>
  <NuxtLayout class="p-4">
    <div class="manager-header">
      <AppButton
        class="layout-invisible icon-button size-large color-neutral -ml-2"
        type="button"
        :icon="mdiArrowLeft"
        to="/projects"
      />
      <h1>Edit Project</h1>
    </div>
    <form class="manager-form">
      <AppInput v-model="projectName" type="text" label="Project Name" />
      <AppInput
        v-model="projectDescription"
        type="textarea"
        label="Project Description"
      />
      <AppButton type="button" class="self-center" @click="saveProject">
        Save Project
      </AppButton>
    </form>
  </NuxtLayout>
</template>
<script setup lang="ts">
import { mdiArrowLeft } from '@mdi/js';

import { GET_PROJECT, UPDATE_PROJECT } from '@/api/queries';

const projectName = ref('');
const projectDescription = ref('');

const route = useRoute();

const queryResult = useClientQuery(GET_PROJECT, {
  id: route.params.projectId || '938a8249-430e-476a-b87d-feb6c66a6f72'
});

watch(
  queryResult.result,
  newValue => {
    if (newValue?.projects_by_pk) {
      projectName.value = newValue.projects_by_pk.name;
      projectDescription.value = newValue.projects_by_pk.description;
    }
  },
  { immediate: true }
);

const { mutate: updateProjectMutation } = useMutation(UPDATE_PROJECT);

async function saveProject() {
  await updateProjectMutation({
    id: route.params.id,
    name: projectName.value,
    description: projectDescription.value
  });
}
</script>
