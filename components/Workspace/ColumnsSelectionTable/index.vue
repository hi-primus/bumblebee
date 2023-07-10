<template>
  <div class="mx-auto font-regular text-md">
    <div class="flex px-2 pb-4 px-4">
      <AppButton
        class="color-neutral icon-button layout-invisible"
        type="button"
        :icon="
          selection?.columns?.length === allColumns.length
            ? mdiCheckboxMarked
            : selection?.columns?.length === 0
            ? mdiCheckboxBlankOutline
            : mdiMinusBox
        "
        @click="toggleAllColumnsSelection"
      />
      <div class="inline-block w-8">
        <Transition name="fade">
          <AppButton
            v-if="selection?.columns?.length"
            v-tooltip="
              hiddenColumns.some(c => selectedColumns.includes(c))
                ? 'Show selected columns'
                : 'Hide selected columns'
            "
            type="button"
            class="color-neutral icon-button layout-invisible"
            :icon="
              selection?.columns?.some(c => hiddenColumns.includes(c))
                ? mdiEye
                : mdiEyeOff
            "
            @click="toggleSelectedColumnsVisibility"
          />
        </Transition>
      </div>
      <div class="inline-block w-8">
        <Transition name="fade">
          <AppButton
            v-if="hiddenColumns.length > 0"
            v-tooltip="'Restore hidden columns'"
            type="button"
            class="color-neutral icon-button layout-invisible"
            :icon="customEyeRestore"
            @click="hiddenColumns = []"
          />
        </Transition>
      </div>
      <Transition name="fade">
        <div
          v-if="
            selection?.columns?.length &&
            selection.columns.length !== allColumns.length
          "
          class="flex"
        >
          <AppButton
            v-tooltip="
              unselectedColumns.every(c => hiddenColumns.includes(c))
                ? 'Show unselected columns'
                : 'Show only selected columns'
            "
            type="button"
            class="color-neutral icon-button layout-invisible"
            :icon="customSelectionEye"
            @click="toggleUnselectedColumnsVisibility"
          />
          <AppButton
            v-tooltip="'Invert selection'"
            type="button"
            class="color-neutral icon-button layout-invisible"
            :icon="mdiCheckboxIntermediateVariant"
            @click="invertSelection"
          />
        </div>
      </Transition>
    </div>
    <table class="">
      <tbody>
        <WorkspaceColumnsSelectionTableRow
          v-for="column in allColumns"
          :key="column.title"
          :column="column"
          :is-selected="selection?.columns?.includes(column.title)"
          :is-hidden="hiddenColumns.includes(column.title)"
          @toggle-selection="toggleColumnSelection(column.title)"
          @toggle-visibilty="toggleColumnVisibility(column.title)"
        />
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import {
  mdiCheckboxBlankOutline,
  mdiCheckboxIntermediateVariant,
  mdiCheckboxMarked,
  mdiEye,
  mdiEyeOff,
  mdiMinusBox
} from '@mdi/js';

import { Column, DataframeObject } from '@/types/dataframe';
import { TableSelection } from '@/types/operations';
import { customEyeRestore, customSelectionEye } from '@/utils/icons';

const dataframeObject = inject<Ref<DataframeObject | null>>(
  'dataframe-object',
  ref(null)
);

const selection = inject('selection') as Ref<TableSelection>;

const hiddenColumns = ref<string[]>([]);

const allColumns = computed<Column[]>(() => {
  return Object.entries(dataframeObject.value?.profile?.columns || {}).map(
    ([title, column]) => ({ title, ...column })
  );
});

function toggleColumnSelection(columnName: string) {
  if (selection?.value?.columns?.includes(columnName)) {
    selection.value.columns = selection.value.columns.filter(
      column => column !== columnName
    );
  } else {
    selection.value = selection.value || { columns: [] };
    selection.value.columns.push(columnName);
  }
}

function toggleAllColumnsSelection() {
  if (selection?.value?.columns?.length === allColumns.value.length) {
    selection.value.columns = [];
  } else {
    selection.value = selection.value || { columns: [] };
    selection.value.columns = allColumns.value.map(column => column.title);
  }
}

function toggleColumnVisibility(columnName: string) {
  if (hiddenColumns.value.includes(columnName)) {
    hiddenColumns.value = hiddenColumns.value.filter(
      column => column !== columnName
    );
  } else {
    hiddenColumns.value.push(columnName);
  }
}

const selectedColumns = computed<string[]>(() => {
  return selection.value?.columns || [];
});

const unselectedColumns = computed<string[]>(() =>
  allColumns.value
    .map(column => column.title)
    .filter(column => !selectedColumns.value.includes(column))
);

function toggleSelectedColumnsVisibility() {
  if (selectedColumns.value.length === 0) {
    return;
  }
  if (
    hiddenColumns.value.some(column => selectedColumns.value.includes(column))
  ) {
    hiddenColumns.value = hiddenColumns.value.filter(
      column => !selectedColumns.value.includes(column)
    );
  } else {
    hiddenColumns.value.push(
      ...selectedColumns.value.filter(
        column => !hiddenColumns.value.includes(column)
      )
    );
  }
}

function toggleUnselectedColumnsVisibility() {
  if (selectedColumns.value.length === 0) {
    return;
  }

  if (
    unselectedColumns.value.every(column =>
      hiddenColumns.value.includes(column)
    )
  ) {
    hiddenColumns.value = hiddenColumns.value.filter(
      column => !unselectedColumns.value.includes(column)
    );
  } else {
    hiddenColumns.value.push(...unselectedColumns.value);
  }
}

function invertSelection() {
  if (selectedColumns.value.length === 0) {
    return;
  }
  selection.value = selection.value || { columns: [] };
  selection.value.columns = allColumns.value
    .map(column => column.title)
    .filter(column => !selectedColumns.value.includes(column));
}
</script>

<style scoped lang="scss">
table {
  td {
    padding: 0.5rem;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
