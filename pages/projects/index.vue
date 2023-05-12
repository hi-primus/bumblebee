<template>
  <NuxtLayout class="manager-page">
    <div class="manager-header">
      <AppMenu
        container-class="ml-auto"
        :items="[
          {
            text: 'Log out',
            action: () => logout()
          }
        ]"
      >
        <AppButton
          class="layout-invisible icon-button size-small color-neutral ml-auto"
          type="button"
          :icon="mdiDotsVertical"
        />
      </AppMenu>
    </div>
    <div class="manager-header">
      <div class="manager-navigation flex-1">
        <h1>Projects</h1>
      </div>
      <form class="manager-form" @submit.prevent="createProject">
        <AppInput
          v-model="newProjectName"
          type="text"
          label="New Project Name"
        />
        <AppButton class="self-center" type="submit">
          Create Project
        </AppButton>
      </form>
    </div>
    <table class="data-table w-full mb-4">
      <thead>
        <tr>
          <th>Name</th>
          <th>Created at</th>
          <th class="actions"></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="project in queryResult.result.value?.projects"
          :key="project.id"
        >
          <td>{{ project.name }}</td>
          <td>
            {{
              new Date(project.created_at).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })
            }}
          </td>

          <td class="actions">
            <span>
              <AppButton
                v-tooltip="'Delete project'"
                class="size-small layout-invisible icon-button color-neutral"
                type="button"
                :icon="mdiTrashCan"
                @click="deleteProject(project.id)"
              />
              <AppButton
                v-tooltip="'View project workspaces'"
                class="size-small layout-invisible icon-button color-neutral"
                type="button"
                :icon="mdiArrowRight"
                :to="{
                  name: `projects-projectId-workspaces`,
                  params: { projectId: project.id }
                }"
              />
            </span>
          </td>
        </tr>
        <tr
          v-if="!queryResult.result.value?.projects?.length"
          class="table-is-empty"
        >
          <td colspan="100">No projects found</td>
        </tr>
      </tbody>
    </table>
  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  mdiArrowLeft,
  mdiArrowRight,
  mdiDotsVertical,
  mdiPencil,
  mdiTrashCan
} from '@mdi/js';

import { CREATE_PROJECT, DELETE_PROJECT, GET_PROJECTS } from '@/api/queries';

useHead({
  title: 'Bumblebee Projects'
});

const { signOut } = useSignOut();

const logout = () => {
  signOut();
  navigateTo('/login');
};

const userId = useUserId();

const queryResult = useClientQuery<{
  projects: {
    id: string;
    name: string;
    description: string;
    created_at: string;
  }[];
}>(GET_PROJECTS, {
  userId: userId.value
});

const { mutate: createProjectMutation, onDone: onDoneCreateProjectMutation } =
  useMutation(CREATE_PROJECT);

const { mutate: deleteProjectMutation, onDone: onDoneDeleteProjectMutation } =
  useMutation(DELETE_PROJECT);

const createProject = () => {
  console.log(
    '[DEBUG] Creating project',
    newProjectName.value,
    newProjectDescription.value
  );

  createProjectMutation({
    user_id: userId.value,
    name: newProjectName.value,
    description: newProjectDescription.value
  });
};

const deleteProject = (id: string) => {
  deleteProjectMutation({
    id
  });
};

onDoneDeleteProjectMutation(() => {
  queryResult.refetch();
});

onDoneCreateProjectMutation(() => {
  newProjectName.value = '';
  newProjectDescription.value = '';
  queryResult.refetch();
});

const newProjectName = ref('');
const newProjectDescription = ref('');

onMounted(() => {
  if (queryResult.result.value) {
    queryResult.refetch();
  }
});
</script>
