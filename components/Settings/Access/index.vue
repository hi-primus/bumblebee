<template>
  <div>
    <form
      v-if="userCanShare"
      ref="accessFormElement"
      class="flex gap-2"
      @submit.prevent="addShareUser"
    >
      <AppInput
        id="shareUserEmail"
        v-model="shareUserEmail"
        name="shareUserEmail"
        class="flex-1"
        label="User email"
      />
      <AppSelector
        id="shareUserLevel"
        v-model="shareUserLevel"
        name="shareUserLevel"
        class="flex-1"
        label="User access"
        :options="shareUserLevels"
      />
      <AppButton type="submit">Add</AppButton>
    </form>
    <div v-if="accesses" class="pt-4 pb-2">
      <h2 class="font-medium mb-2">People with access</h2>
      <div
        v-for="access in accesses"
        :key="access.id"
        class="flex gap-2 h-12 items-center"
      >
        <div class="w-[60%] flex flex-col">
          <span class="text-sm text-neutral-light font-semibold">
            {{ displayName(access) }}
          </span>
          <span class="text-xs text-neutral-lighter">
            {{ access.workspace_access_user.email }}
          </span>
        </div>
        <div class="w-[30%] text-right">
          <AppMenu
            v-if="canEditAccess(access) || false"
            :items="
              shareUserLevels.map(level => ({
                text: level,
                action: () => updateAccessLevel(access, level)
              }))
            "
          >
            <AppButton class="layout-invisible color-neutral ml-auto">
              {{ access.access_level }}
              <Icon :path="mdiMenuDown" />
            </AppButton>
          </AppMenu>
          <div v-else class="text-sm font-bold pr-10 text-neutral">
            {{ access.access_level }}
          </div>
        </div>
        <IconButton
          v-if="canDeleteAccess(access)"
          :path="mdiClose"
          class="text-right min-w-4 w-4 h-4 ml-auto text-neutral"
          @click="deleteAccess(access)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { mdiClose, mdiMenuDown } from '@mdi/js';
import { useApolloClient } from '@vue/apollo-composable';

import {
  CREATE_WORKSPACE_ACCESS,
  DELETE_WORKSPACE_ACCESS,
  GET_USER_BY_EMAIL,
  GET_WORKSPACE_ACCESSES,
  UPDATE_WORKSPACE_ACCESS
} from '@/api/queries';

type Emits = {
  (e: 'update-status', value: 'updated' | 'updating' | Error): void;
};

const emit = defineEmits<Emits>();

const route = useRoute();

type Access = {
  access_level: string;
  id: string;
  workspace_access_user: {
    email: string;
    id: string;
    metadata?: {
      firstName?: string;
      lastName?: string;
    }
  };
  is_accepted: boolean;
  sender_id: string;
  workspace_id: string;
};

const accessesResult = useClientQuery<{
  workspace_access: Access[];
}>(GET_WORKSPACE_ACCESSES, {
  workspaceId: route.params.workspaceId
});

const accesses = ref<Access[]>([]);

watch(accessesResult.result, newValue => {
  accesses.value = newValue?.workspace_access || [];
});

const shareUserLevels = [
  'Owner',
  'Editor with Sharing',
  'Editor',
  'Viewer',
  'Predictor'
] as const;

const shareUserEmail = ref('');
const shareUserLevel = ref<ObjectValues<typeof shareUserLevels>>('Editor');

const { mutate: createAccessMutation, onDone: onDoneCreateAccessMutation } =
  useMutation(CREATE_WORKSPACE_ACCESS);

const { mutate: updateAccessMutation, onDone: onDoneUpdateAccessMutation } =
  useMutation(UPDATE_WORKSPACE_ACCESS);

const { mutate: deleteAccessMutation, onDone: onDoneDeleteAccessMutation } =
  useMutation(DELETE_WORKSPACE_ACCESS);

const { resolveClient } = useApolloClient();

const userId = useUserId();

function displayName(access: Access) {
  if (access.workspace_access_user?.metadata?.firstName && access.workspace_access_user?.metadata?.lastName) {
    return `${access.workspace_access_user.metadata.firstName} ${access.workspace_access_user.metadata.lastName}`
  }
  return access.workspace_access_user.email
}

const userCanShare = computed(() => {
  return ['Owner', 'Editor with Sharing'].includes(
    accesses.value.find(a => a.workspace_access_user.id === userId.value)
      ?.access_level || ''
  );
});

function canEditAccess(access: Access) {
  return userCanShare.value && access.access_level !== 'Owner';
}

function canDeleteAccess(access: Access) {
  return userCanShare.value && access.access_level !== 'Owner';
}

async function addShareUser() {
  try {
    emit('update-status', 'updating');
    const apolloClient = resolveClient();
    const userResult = await apolloClient.query({
      query: GET_USER_BY_EMAIL,
      variables: {
        email: shareUserEmail.value
      }
    });

    const receiverId = userResult?.data?.users?.[0]?.id;

    if (!receiverId) {
      throw new Error(`User with email '${shareUserEmail.value}' not found`);
    }

    console.log('[DEBUG] Setting new workspace access', {
      workspaceId: route.params.workspaceId
    });

    createAccessMutation({
      accessLevel: shareUserLevel.value,
      workspaceId: route.params.workspaceId,
      receiverId,
      senderId: userId.value
    });
  } catch (err) {
    console.error(err);
    emit('update-status', err);
  }
}

function updateAccessLevel(
  access: Access,
  newLevel: ObjectValues<typeof shareUserLevels>
) {
  try {
    emit('update-status', 'updating');

    updateAccessMutation({
      id: access.id,
      accessLevel: newLevel,
      isAccepted: access.is_accepted,
      receiverId: access.workspace_access_user.id,
      senderId: access.sender_id,
      workspaceId: route.params.workspaceId
    });
  } catch (err) {
    console.error(err);
    emit('update-status', err);
  }
}

function deleteAccess(access: Access) {
  try {
    emit('update-status', 'updating');
    deleteAccessMutation({
      id: access.id
    });
  } catch (err) {
    console.error(err);
    emit('update-status', err);
  }
}

onDoneCreateAccessMutation(async () => {
  await accessesResult.refetch();
  emit('update-status', 'updated');
});
onDoneUpdateAccessMutation(async () => {
  await accessesResult.refetch();
  emit('update-status', 'updated');
});
onDoneDeleteAccessMutation(async () => {
  await accessesResult.refetch();
  emit('update-status', 'updated');
});
</script>
