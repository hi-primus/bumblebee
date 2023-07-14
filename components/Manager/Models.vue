<template>
  <div>
    <table class="data-table w-full mb-4">
      <thead>
        <tr>
          <th>Name</th>
          <th>Latest version</th>
          <th>Accuracy</th>
          <th>Created at</th>
          <th>Last updated at</th>
          <th class="actions"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="model in modelsData" :key="model.id">
          <td>{{ model.name }}</td>
          <td>{{ model.latestVersion }}</td>
          <td>{{ model.accuracy }}</td>
          <td>
            {{
              new Date(model.createdAt).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })
            }}
          </td>
          <td>
            {{
              new Date(model.lastUpdatedAt).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })
            }}
          </td>
          <td class="actions">
            <span>
              <AppButton
                v-tooltip="'Delete model'"
                class="size-small layout-invisible icon-button color-neutral"
                type="button"
                :icon="mdiTrashCan"
                @click.stop="deleteModel(model.id)"
              />
              <AppButton
                v-tooltip="'Predict using model'"
                class="size-small layout-invisible icon-button color-neutral"
                type="button"
                :icon="mdiCheck"
                @click.stop="applyModel(model.id)"
              />
            </span>
          </td>
        </tr>
        <tr v-if="!models?.length" class="table-is-empty">
          <td colspan="100">No models found</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { mdiCheck, mdiTrashCan } from '@mdi/js';

import { ModelResponse } from '@/types/app';

const route = useRoute();

const { selectOperation } = inject('operation-actions') as OperationActions;

const emit = defineEmits(['close']);

function applyModel(id: string) {
  const model = models.value.find(model => model.id === id);
  if (!model) {
    return;
  }
  const latestVersion = model.latest_versions?.[0];
  selectOperation(operations.predict, {
    models: models.value,
    modelName: model?.name,
    modelVersion: latestVersion?.version,
    selectionFromPlot: true
  });
  emit('close');
}

const { get, del } = useHttpMethods();

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
    >(url, { throwError: true });

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

const { addToast } = useToasts();

// model_name is the id of the model

async function deleteModel(modelName: string) {
  try {
    const url =
      '/models?' +
      new URLSearchParams({
        model_name: modelName || ''
      });
    await del(url);
    models.value = models.value.filter(model => model.name !== modelName);
    addToast({
      type: 'success',
      title: 'Model deleted'
    });
  } catch (err) {
    console.error('Error deleting model', err);
    addToast({
      type: 'error',
      title: 'Error deleting model'
    });
  }
}

const models = ref<ModelResponse[]>([]);
const loading = ref(false);

const modelsData = computed(() => {
  return models.value.map(model => {
    const name = model.tags.name || model.name.replace(/^(.*?)(__)/, '');

    const latestVersion = model.latest_versions?.[0];

    return {
      id: model.name,
      name,
      createdAt: model.creation_timestamp,
      lastUpdatedAt: model.last_updated_timestamp,
      latestVersion: latestVersion?.version,
      accuracy: latestVersion?.tags?.accuracy
    };
  });
});

onMounted(async () => {
  loading.value = true;
  models.value = await getProjectModels();
  loading.value = false;
});
</script>
