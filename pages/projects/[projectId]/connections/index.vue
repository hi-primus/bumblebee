<template>
  <NuxtLayout class="manager-page">
    <div class="manager-header !pt-24">
      <div class="manager-navigation flex-1">
        <NuxtLink class="title" to="/projects"> Projects </NuxtLink>
        <Icon class="chevron-icon" :path="mdiChevronRight" />
        <template
          v-if="projectQueryResult?.result?.value?.projects_by_pk?.name"
        >
          <NuxtLink
            class="title"
            :to="`/projects/${route.params.projectId}/workspaces`"
          >
            {{ projectQueryResult?.result?.value?.projects_by_pk?.name }}
          </NuxtLink>
          <Icon class="chevron-icon" :path="mdiChevronRight" />
          <h1>Connections</h1>
        </template>
        <Icon v-else class="loading-icon" :path="mdiLoading" />
      </div>
      <form class="manager-form">
        <AppInput
          v-model="connectionName"
          type="text"
          label="Connection Name"
        />
        <AppButton class="self-center" type="button" @click="createConnection">
          Create Connection
        </AppButton>
      </form>
    </div>
    <table class="data-table w-full">
      <thead>
        <tr>
          <th>Name</th>
          <th>Description</th>
          <th>Created at</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="connection in connectionsQueryResult.result.value?.connections"
          :key="connection.id"
        >
          <td>{{ connection.name }}</td>
          <td>{{ connection.description }}</td>
          <td>
            {{
              new Date(connection.created_at).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })
            }}
          </td>

          <td>
            <!-- TODO: Fix connectionId => projectId -->
            <AppButton
              v-tooltip="'Edit connection'"
              class="size-small layout-invisible icon-button color-neutral"
              type="button"
              :icon="mdiPencil"
              :to="{
                name: 'projects-projectId-workspaces',
                param: { projectId: connection.id }
              }"
            />
            <AppButton
              v-tooltip="'Delete connection'"
              class="size-small layout-invisible icon-button color-neutral"
              type="button"
              :icon="mdiTrashCan"
              @click="deleteConnection(connection.id)"
            />
          </td>
        </tr>
        <tr
          v-if="!connectionsQueryResult.result.value?.connections?.length"
          class="table-is-empty"
        >
          <td colspan="100">No connections found</td>
        </tr>
      </tbody>
    </table>
  </NuxtLayout>
</template>
<script setup>
import { mdiChevronRight, mdiLoading, mdiPencil, mdiTrashCan } from '@mdi/js';

import {
  // CREATE_CONNECTION,
  DELETE_CONNECTION,
  GET_CONNECTIONS,
  GET_PROJECT
} from '@/api/queries';

const route = useRoute();

const projectQueryResult = useClientQuery(GET_PROJECT, {
  id: route.params.projectId
});

const connectionsQueryResult = useClientQuery(GET_CONNECTIONS, {
  project_id: route.params.projectId
});

const {
  mutate: deleteConnectionMutation,
  onDone: onDoneDeleteConnectionMutation
} = useMutation(DELETE_CONNECTION);

const deleteConnection = id => {
  deleteConnectionMutation({ id });
};
onDoneDeleteConnectionMutation(() => {
  connectionsQueryResult.refetch();
});
// onDoneCreateConnectionMutation(() => {
//   connectionName.value = '';
//   connectionDescription.value = '';
//   queryResult.refetch();
// });

const connectionName = ref('');

onMounted(() => {
  if (projectQueryResult.result.value) {
    projectQueryResult.refetch();
  }
  if (connectionsQueryResult.result.value) {
    connectionsQueryResult.refetch();
  }
});
</script>
