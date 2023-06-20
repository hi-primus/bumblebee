<template>
  <NuxtLayout class="manager-page">
    <div class="manager-header">
      <AppMenu
        container-class="ml-auto"
        :items="[
          {
            text: 'Log out',
            action: () => logout()
          },
          {
            text: 'Manage projects',
            action: () => navigateTo(`/projects`)
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
        <h1>Users</h1>
      </div>
      <AppButton class="creation-button" type="submit" @click="addUserPopup">
        Add User
      </AppButton>
    </div>
    <form v-if="false" class="manager-form" @submit.prevent="">
      <AppInput v-model="firstName" type="text" label="Name" />
      <AppInput v-model="lastName" type="text" label="Last Name" />

      <AppInput v-model="email" type="text" label="Email" />
      <AppInput
        id="password"
        v-model="password"
        type="password"
        label="Password"
      />

      <AppButton class="self-center" type="submit"> Create User </AppButton>
    </form>
    <table class="data-table clickable w-full mb-4">
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
              <!-- <AppButton
                v-tooltip="`Edit user`"
                class="size-small layout-invisible icon-button color-neutral"
                :icon="mdiPencil"
                :to="{
                  name: `projects-projectId-workspaces`,
                  params: { projectId: user.id }
                }"
                type="button"
              /> -->
              <AppButton
                v-tooltip="`Delete user`"
                class="size-small layout-invisible icon-button color-neutral"
                type="button"
                :icon="mdiTrashCan"
                @click="deleteUser(user.id)"
              />
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
<script setup lang="ts">
import { mdiDotsVertical, mdiPencil, mdiTrashCan } from '@mdi/js';

import { DELETE_USER, GET_USERS } from '@/api/queries';

const email = ref('');
const password = ref('');
const firstName = ref('');
const lastName = ref('');

const userId = useUserId();

const { signUpEmailPassword } = useSignUpEmailPassword();

const nhost = useNhostClient();

const { addToast } = useToasts();

const { confirm } = useConfirmPopup();

const queryResult = useClientQuery(GET_USERS, () => ({
  id: userId?.value
}));

const AppInput = resolveComponent('AppInput');

type SignUpData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

const addUserPopup = async () => {
  const result = await confirm<SignUpData>({
    message: 'Create new User',
    fields: [
      {
        component: AppInput,
        name: 'firstName',
        label: 'Name'
      },
      {
        component: AppInput,
        name: 'lastName',
        label: 'Last Name'
      },
      {
        component: AppInput,
        name: 'email',
        label: 'Email'
      },
      {
        component: AppInput,
        name: 'password',
        label: 'Password',
        type: 'password'
      }
    ],
    acceptLabel: 'Create',
    cancelLabel: 'Cancel'
  });

  if (typeof result === 'object' && 'email' in result && result.email) {
    addUser(result);
  }
};

const addUser = async (data: SignUpData) => {
  console.log('[DEBUG] Creating user', email);

  await signOut();

  await signUpEmailPassword(data.email, data.password, {
    metadata: { firstName: data.firstName, lastName: data.lastName }
  });

  addToast({
    title: 'User created successfully',
    type: 'success'
  });

  logout();

  addToast({
    title: 'Session terminated',
    type: 'error'
  });
};

const { mutate: deleteUserMutation, onDone: onDoneDeleteUserMutation } =
  useMutation(DELETE_USER);

const deleteUser = id => {
  deleteUserMutation({ id });
};
onDoneDeleteUserMutation(() => {
  queryResult.refetch();
});

const { signOut } = useSignOut();

const logout = () => {
  signOut();
  navigateTo('/login');
};

// onDoneCreateUserMutation(() => {
//   connectionName.value = '';
//   connectionDescription.value = '';
//   connectionRefresh();
// });
</script>
