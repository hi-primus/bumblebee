<template>
  <div>
    <table class="data-table w-full mb-4">
      <thead>
        <tr>
          <th>Name</th>
          <th>Created at</th>
          <th class="actions"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="macro in macrosData" :key="macro.id">
          <td>{{ macro.name }}</td>
          <td>
            {{
              new Date(macro?.created_at || 0).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })
            }}
          </td>
          <td class="actions">
            <span v-if="macro.id">
              <AppButton
                v-tooltip="'Delete macro'"
                class="size-small layout-invisible icon-button color-neutral"
                type="button"
                :icon="mdiTrashCan"
                @click.stop="deleteMacroAndRefetch(macro.id)"
              />
              <AppButton
                v-tooltip="'Apply macro'"
                class="size-small layout-invisible icon-button color-neutral"
                type="button"
                :icon="mdiCheck"
                @click.stop="applyMacro(macro.id)"
              />
            </span>
          </td>
        </tr>
        <tr v-if="!macros?.length" class="table-is-empty">
          <td colspan="100">No macros found</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { mdiCheck, mdiTrashCan } from '@mdi/js';

import { GET_MACROS } from '@/api/queries';
import { Macro } from '@/types/app';
import { DataframeObject } from '@/types/dataframe';
import { OperationActions, OperationItem } from '@/types/operations';

const { getAndApplyMacro, deleteMacro } = useMacroActions();

const emit = defineEmits(['close']);

const operationItems = inject<Ref<OperationItem[]>>('operations', ref([]));

const dataframes = inject<Ref<DataframeObject[]>>('dataframes', ref([]));

const { submitOperation } = inject('operation-actions') as OperationActions;

async function deleteMacroAndRefetch(id: string) {
  await deleteMacro(id);
  return await queryResult.refetch();
}

const { confirm } = useConfirmPopup();

const ManagerMacroForm = resolveComponent('ManagerMacroForm');

async function applyMacro(id: string) {
  const result = await confirm<{ id: string; [key: string]: string }>({
    title: 'Apply macro',
    fields: [
      {
        component: ManagerMacroForm,
        name: 'macro',
        preselectedMacroId: id,
        dataframes: dataframes.value
      }
    ]
  });

  if (typeof result !== 'object') {
    return;
  }

  const selectedDataframes = Object.keys(result)
    .filter(key => !isNaN(Number(key)))
    .map(key => dataframes.value.find(df => df.name === result[key]))
    .filter((v): v is DataframeObject => Boolean(v));

  const newOperations = await getAndApplyMacro(
    id,
    operationItems.value,
    selectedDataframes,
    dataframes.value
  );

  if (newOperations) {
    operationItems.value = newOperations;
    await submitOperation(null, null, false);
  }

  emit('close');
}

const loading = ref(true);

const queryResult = useClientQuery<{ macros: Partial<Macro>[] }>(GET_MACROS, {
  limit: 1000,
  offset: 0
});

const macros = computed<Partial<Macro>[]>(
  () => queryResult.result.value?.macros || []
);

queryResult.onResult(() => {
  loading.value = false;
});

const macrosData = computed(() => {
  return macros.value.map(macro => {
    return macro;
  });
});
</script>
