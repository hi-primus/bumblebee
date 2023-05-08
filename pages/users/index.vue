<template>
  <NuxtLayout class="p-4">
    <form class="manager-form" @submit.prevent="handleSubmit">
      <AppInput v-model="firstName" type="text" label="Name" />
      <AppInput v-model="lastName" type="text" label="Last Name" />

      <AppInput v-model="username" type="text" label="Email" />
      <AppInput
        id="password"
        v-model="password"
        type="password"
        label="Password"
      />

      <AppButton class="mt-2 self-center" type="submit">
        Create User
      </AppButton>
    </form>
    <table class="data-table w-full">
      <thead>
        <tr>
          <th>Name</th>
          <th>Last Name</th>
          <th>Email</th>
          <th>Disabled</th>
          <th>Email Verified</th>
          <th>Created At</th>
          <th class="actions">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in queryResult.result.value?.users" :key="user.id">
          <td>{{ user.metadata.firstName }}</td>
          <td>{{ user.metadata.lastName }}</td>
          <td>{{ user.email }}</td>

          <td>{{ user.disabled }}</td>
          <td>{{ user.emailVerified }}</td>
          <td>
            {{
              new Date(user.createdAt).toLocaleDateString('en-US', {
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
                :to="`/projects/${user.id}/workspaces/`"
                type="button"
              >
                Edit
              </AppButton>
              <AppButton
                class="size-smallest"
                type="button"
                @click="deleteConnection(user.id)"
              >
                Delete
              </AppButton>
            </span>
          </td>
        </tr>
        <tr
          v-if="!queryResult.result.value?.users?.length"
          class="table-is-empty"
        >
          <td colspan="100">No users found</td>
        </tr>
      </tbody>
    </table>
  </NuxtLayout>
</template>
<script setup>
import { DELETE_USER, GET_USERS } from '@/api/queries';

const username = ref('');
const password = ref('');
const firstName = ref('');
const lastName = ref('');

const router = useRouter();
const userId = useUserId();

const { signUpEmailPassword } = useSignUpEmailPassword();

const queryResult = useClientQuery(GET_USERS, () => ({
  id: userId?.value
}));
const handleSubmit = async event => {
  event.preventDefault();
  const { isSuccess } = await signUpEmailPassword(username, password, {
    metadata: { firstName, lastName },
    allowedRoles: ['user']
  });
  if (isSuccess) router.push('/');
};

const { mutate: deleteUserMutation, onDone: onDoneDeleteUserMutation } =
  useMutation(DELETE_USER);

const deleteConnection = id => {
  deleteUserMutation({ id });
};
onDoneDeleteUserMutation(() => {
  queryResult.refetch();
});
// onDoneCreateUserMutation(() => {
//   connectionName.value = '';
//   connectionDescription.value = '';
//   connectionRefresh();
// });
</script>
