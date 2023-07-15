<template>
  <div>
    <div class="table-container min-h-[626px] mb-4">
      <table class="data-table w-full">
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
    <TransitionGroup
      tag="div"
      name="fade"
      class="flex w-full min-h-[2rem] max-w-[10rem] mx-auto"
    >
      <AppButton
        v-if="page > 0"
        class="layout-invisible icon-button color-neutral"
        type="button"
        :icon="mdiChevronLeft"
        @click="page--"
      />
      <AppButton
        v-if="hasNextPage"
        class="layout-invisible icon-button color-neutral ml-auto"
        type="button"
        :icon="mdiChevronRight"
        @click="page++"
      />
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import {
  mdiCheck,
  mdiChevronLeft,
  mdiChevronRight,
  mdiTrashCan
} from '@mdi/js';

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

const PAGE_SIZE = 10;

const page = ref(0);

const queryResult = useClientQuery<{ macros: Partial<Macro>[] }>(GET_MACROS, {
  limit: PAGE_SIZE + 1,
  offset: PAGE_SIZE * page.value
});

watch(page, () => {
  queryResult.refetch({
    limit: PAGE_SIZE + 1,
    offset: PAGE_SIZE * page.value
  });
});

const macros = computed<Partial<Macro>[]>(
  () => queryResult.result.value?.macros || []
);

queryResult.onResult(() => {
  loading.value = false;
});

const macrosData = computed(() => {
  return macros.value
    .map(macro => {
      return macro;
    })
    .splice(0, PAGE_SIZE);
});

const hasNextPage = computed(() => {
  return macros.value.length > PAGE_SIZE;
});

onMounted(() => {
  if (queryResult.result.value) {
    queryResult.refetch();
  }
});
</script>

<style scoped lang="scss">
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  pointer-events: none;
  opacity: 0;
}
</style>
