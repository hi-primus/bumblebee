<template>
  <NuxtLayout class="p-4">
    <form class="manager-form">
      <AppInput v-model="connectionName" type="text" label="Connection Name" />
      <AppInput
        v-model="connectionDescription"
        type="textarea"
        label="Connection Description"
      />

      <AppButton class="self-center" type="button" @click="createConnection">
        Create Connection
      </AppButton>
    </form>
    <table class="data-table w-full">
      <thead>
        <tr>
          <th>Name</th>
          <th>Description</th>
          <th>Created at</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="connection in queryResult.result.value?.connections"
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
            <AppButton
              class="size-smallest"
              type="button"
              :to="'/projects/' + connection.id + '/workspaces/'"
            >
              View
            </AppButton>

            <AppButton
              class="size-smallest"
              type="button"
              @click="deleteConnection(connection.id)"
            >
              Delete
            </AppButton>
          </td>
        </tr>
        <tr
          v-if="!queryResult.result.value?.connections?.length"
          class="table-is-empty"
        >
          <td colspan="100">No connections found</td>
        </tr>
      </tbody>
    </table>
  </NuxtLayout>
</template>
<script setup>
import {
  // CREATE_CONNECTION,
  DELETE_CONNECTION,
  GET_CONNECTIONS
} from '@/api/queries';

const route = useRoute();

const queryResult = useClientQuery(GET_CONNECTIONS, {
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
  queryResult.refetch();
});
// onDoneCreateConnectionMutation(() => {
//   connectionName.value = '';
//   connectionDescription.value = '';
//   queryResult.refetch();
// });

const connectionName = ref('');
const connectionDescription = ref('');
</script>
