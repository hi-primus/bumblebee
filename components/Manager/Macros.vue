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
import { OperationItem } from '@/types/operations';

const { getAndApplyMacro, deleteMacro } = useMacroActions();

const emit = defineEmits(['close']);

const operationCells = inject<Ref<OperationItem[]>>('operationCells', ref([]));

const dataframes = inject<Ref<DataframeObject[]>>('dataframes', ref([]));

async function deleteMacroAndRefetch(id: string) {
  await deleteMacro(id);
  return await queryResult.refetch();
}

async function applyMacro(id: string) {
  await getAndApplyMacro(id, operationCells.value, dataframes.value);
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
