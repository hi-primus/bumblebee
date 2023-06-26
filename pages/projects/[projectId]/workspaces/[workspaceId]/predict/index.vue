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
          <h1>
            Predict ({{
              workspaceQueryResult?.result?.value?.workspaces_by_pk?.name
            }})
          </h1>
        </template>
        <Icon v-else class="loading-icon" :path="mdiLoading" />
      </div>
    </div>
    <div class="max-w-[1140px] flex">
      <form
        class="w-1/2 pl-4 pr-2 flex flex-col gap-4"
        @submit.prevent="predict"
      >
        <AppFile
          v-model="file"
          label="File"
          placeholder="Select a file"
          name="file"
        />
        <AppSelector
          v-model="model"
          label="Model"
          name="model"
          :options="modelsOptions"
        />
        <AppSelector
          v-if="modelVersions?.length"
          v-model="modelVersion"
          label="Model version"
          name="model"
          :options="modelVersions"
        />
        <div class="flex justify-end">
          <AppButton :disabled="!file || !model || !modelVersion" type="submit">
            Predict
          </AppButton>
        </div>
      </form>
      <div class="w-1/2 pr-4">
        <InfoTable
          v-if="driftTableData"
          :data="driftTableData"
          class="w-full"
        />
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { mdiChevronRight, mdiDotsVertical, mdiLoading } from '@mdi/js';

import { GET_PROJECT, GET_WORKSPACE_INFO } from '@/api/queries';
import { ModelResponse, SelectOption } from '@/types/app';
import { getModelOptions, getModelVersionsOptions } from '@/utils/ml';

const route = useRoute();

const projectQueryResult = useClientQuery(GET_PROJECT, {
  id: route.params.projectId
});

const workspaceQueryResult = useClientQuery<{
  workspaces_by_pk: { name: string };
}>(GET_WORKSPACE_INFO, {
  id: route.params.workspaceId
});

const { post, get } = useHttpMethods();

const { uploadFile } = useUploadFile();

const { addToast } = useToasts();

const file = ref<File | null>(null);

const filepath = ref<string>('');

const model = ref<string | null>(null);

const modelVersion = ref<string | null>(null);

const modelsResponse = ref<ModelResponse[] | null>(null);

const modelsOptions = computed<SelectOption[]>(() => {
  if (modelsResponse.value?.length) {
    return getModelOptions(
      modelsResponse.value,
      route.params.workspaceId as string
    );
  }
  return [
    {
      text: 'No models available',
      value: 'No model',
      disabled: true
    }
  ];
});

const modelVersions = computed<SelectOption[]>(() => {
  if (modelsResponse.value?.length && model.value) {
    // find model matching in modelsResponse
    const versions = modelsResponse.value.find(
      modelResponseItem => modelResponseItem.name === model.value
    )?.latest_versions;
    if (versions?.length) {
      return getModelVersionsOptions(versions);
    }
  }
  return [];
});

const driftResponse = ref<Record<string, unknown> | null>(null);

watch([file, model, modelVersion], async () => {
  if (!file.value || !model.value || !modelVersion.value) {
    filepath.value = '';
    driftResponse.value = null;
    return;
  }

  const fileResponse = await uploadFile(file.value);

  if (fileResponse.error) {
    console.error('Error uploading file', fileResponse.error);
    addToast({
      type: 'error',
      title: 'Error uploading file'
    });
  }

  filepath.value = fileResponse.filepath;

  const response = await post<{
    drift?: string;
    detail?: string;
  }>('/drift', {
    data_uri: fileResponse.filepath,
    model_name: model.value,
    model_version: modelVersion.value
  });

  if (response.detail) {
    console.error('Error getting drift', response.detail);
    addToast({
      type: 'error',
      title: 'Error getting drift'
    });
  }

  if (response?.drift) {
    driftResponse.value = JSON.parse(response.drift);
  }
});

const driftTableData = computed(() => {
  if (driftResponse.value) return getDriftTableData(driftResponse.value);
});

const getProjectModels = async () => {
  try {
    const url =
      '/workspaces/models?' +
      new URLSearchParams({
        workspace_id: route.params.workspaceId as string
      });

    const response = await get<
      | {
          detail?: string;
        }
      | ModelResponse[]
    >(url);

    if (!Array.isArray(response)) {
      if (response.detail) {
        throw new Error(response.detail);
      }
      throw new Error('Unknown error');
    }

    return response;
  } catch (err) {
    console.error('Error getting project models', err);
    return [];
  }
};

async function predict() {
  if (!filepath.value) {
    if (!file.value) {
      return;
    }

    const fileResponse = await uploadFile(file.value);

    if (fileResponse.error) {
      console.error('Error uploading file', fileResponse.error);
      addToast({
        type: 'error',
        title: 'Error uploading file'
      });
    }

    filepath.value = fileResponse.filepath;
  }

  const response = await post<Response | { detail: string }>(
    '/predict',
    {
      data_uri: filepath.value,
      model_name: model.value,
      model_type: 'classification',
      output: 'download',
      version: modelVersion.value
    },
    { getJson: false }
  );

  if (!response || !(response instanceof Response)) {
    console.error('Error predicting', response);
    addToast({
      type: 'error',
      title: 'Error predicting'
    });
    return;
  }

  const blob = await response.blob();
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = file.value?.name || 'prediction.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

const { signOut } = useSignOut();

const logout = () => {
  signOut();
  navigateTo('/login');
};

onMounted(async () => {
  modelsResponse.value = await getProjectModels();
});
</script>
