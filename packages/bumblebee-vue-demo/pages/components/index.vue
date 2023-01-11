<template>
  <NuxtLayout>
    <div class="components-container">
      <div class="flex flex-wrap gap-4 px-8 py-2 min-w-[200px]">
        {{ selection || 'no selection' }}
      </div>
      <div class="flex flex-wrap gap-4 px-8 py-2 min-w-[200px]">
        {{ hovered || 'no hover' }}
      </div>
      <div class="flex flex-wrap gap-4 px-8 py-2 min-w-[200px]">
        <PlotBarsBase
          column-name="test"
          :data="columnValues"
          :width="80"
          selectable
          @hovered="
            hovered = { plot: 'columnValues', value: columnValues[$event] }
          "
        />
        <PlotBarsBase
          column-name="test2"
          :data="otherColumnValues"
          :width="80"
          selectable
          @hovered="
            hovered = {
              plot: 'otherColumnValues',
              value: otherColumnValues[$event]
            }
          "
        />
        <PlotBarsBase
          :data="notColumnValues"
          :width="80"
          @hovered="
            hovered = {
              plot: 'notColumnValues',
              value: notColumnValues[$event]
            }
          "
        />
      </div>
      <div class="flex flex-wrap gap-4 px-8 py-2">
        <AppButton>Accept</AppButton>
        <AppButton class="btn-layout-outline">Outline</AppButton>
        <AppButton class="btn-layout-invisible">Invisible</AppButton>
        <AppButton class="btn-layout-text">Text</AppButton>
        <AppButton class="btn-icon">
          <Icon :path="mdiCheckBold" />
        </AppButton>
        <AppButton class="btn-icon btn-layout-invisible">
          <Icon :path="mdiCheckBold" />
        </AppButton>
        <AppButton class="btn-icon btn-rounded">
          <Icon :path="mdiCheckBold" />
        </AppButton>
      </div>
      <div class="flex flex-wrap gap-4 px-8 py-2">
        <AppButton loading>Accept</AppButton>
        <AppButton loading class="btn-layout-outline">Outline</AppButton>
        <AppButton loading class="btn-layout-invisible">Invisible</AppButton>
        <AppButton loading class="btn-layout-text">Text</AppButton>
        <AppButton loading class="btn-icon">
          <Icon :path="mdiCheckBold" />
        </AppButton>
        <AppButton loading class="btn-icon btn-layout-invisible">
          <Icon :path="mdiCheckBold" />
        </AppButton>
        <AppButton loading class="btn-icon btn-rounded">
          <Icon :path="mdiCheckBold" />
        </AppButton>
      </div>
      <div class="flex flex-wrap gap-4 px-8 py-2">
        <AppButton disabled>Accept</AppButton>
        <AppButton disabled class="btn-layout-outline">Outline</AppButton>
        <AppButton disabled class="btn-layout-invisible">Invisible</AppButton>
        <AppButton disabled class="btn-layout-text">Text</AppButton>
        <AppButton disabled class="btn-icon">
          <Icon :path="mdiCheckBold" />
        </AppButton>
        <AppButton disabled class="btn-icon btn-layout-invisible">
          <Icon :path="mdiCheckBold" />
        </AppButton>
        <AppButton disabled class="btn-icon btn-rounded">
          <Icon :path="mdiCheckBold" />
        </AppButton>
      </div>
      <div class="flex flex-wrap gap-4 px-8 py-2">
        <AppButton class="btn-rounded">Accept</AppButton>
        <AppButton class="btn-rounded btn-layout-outline">Outline</AppButton>
        <AppButton class="btn-rounded btn-layout-invisible">
          Invisible
        </AppButton>
        <AppButton class="btn-rounded btn-layout-text">Text</AppButton>
        <AppButton class="btn-rounded btn-icon">
          <Icon :path="mdiCheckBold" />
        </AppButton>
        <AppButton class="btn-icon btn-layout-invisible">
          <Icon :path="mdiCheckBold" />
        </AppButton>
        <AppButton class="btn-icon btn-rounded">
          <Icon :path="mdiCheckBold" />
        </AppButton>
      </div>
      <div class="flex flex-wrap gap-4 px-8 py-2">
        <AppButton class="btn-color-error">Delete</AppButton>
        <AppButton class="btn-color-error btn-layout-outline">Delete</AppButton>
        <AppButton class="btn-color-error btn-layout-invisible">
          Delete
        </AppButton>
        <AppButton class="btn-color-error btn-layout-text">Delete</AppButton>
        <AppButton class="btn-color-error btn-icon">
          <Icon :path="mdiTrashCan" />
        </AppButton>
        <AppButton class="btn-color-error btn-icon btn-rounded">
          <Icon :path="mdiTrashCan" />
        </AppButton>
      </div>
      <div class="flex flex-wrap gap-4 px-8 py-2">
        <AppButton class="btn-color-text"> Cancel </AppButton>
        <AppButton class="btn-color-text btn-layout-outline">
          Cancel
        </AppButton>
        <AppButton class="btn-color-text btn-layout-invisible">
          Cancel
        </AppButton>
        <AppButton class="btn-color-text btn-layout-text"> Cancel </AppButton>
        <AppButton class="btn-color-text btn-icon">
          <Icon :path="mdiTrashCan" />
        </AppButton>
        <AppButton class="btn-color-text btn-icon btn-rounded">
          <Icon :path="mdiTrashCan" />
        </AppButton>
        <AppButton class="btn-color-text btn-icon btn-layout-invisible">
          <Icon :path="mdiTrashCan" />
        </AppButton>
        <AppButton
          class="btn-color-text btn-icon btn-layout-invisible btn-size-small"
        >
          <Icon :path="mdiTrashCan" />
        </AppButton>
        <!-- small -->
      </div>
      <div class="flex flex-wrap gap-4 px-8 py-2">
        <AppButton class="btn-size-small">Accept</AppButton>
        <AppButton class="btn-size-small btn-layout-outline">Outline</AppButton>
        <AppButton class="btn-size-small btn-layout-invisible">
          Invisible
        </AppButton>
        <AppButton class="btn-size-small btn-layout-text">Text</AppButton>
        <AppButton class="btn-size-small btn-icon">
          <Icon :path="mdiCheckBold" />
        </AppButton>
        <AppButton class="btn-size-small btn-icon btn-rounded">
          <Icon :path="mdiCheckBold" />
        </AppButton>
      </div>
      <div class="flex flex-wrap gap-4 px-8 py-2">
        <AppButton class="btn-size-small btn-color-error">Delete</AppButton>
        <AppButton class="btn-size-small btn-color-error btn-layout-outline">
          Delete
        </AppButton>
        <AppButton class="btn-size-small btn-color-error btn-layout-invisible">
          Delete
        </AppButton>
        <AppButton class="btn-size-small btn-color-error btn-layout-text">
          Delete
        </AppButton>
        <AppButton class="btn-size-small btn-color-error btn-icon">
          <Icon :path="mdiTrashCan" />
        </AppButton>
        <AppButton class="btn-size-small btn-color-error btn-icon btn-rounded">
          <Icon :path="mdiTrashCan" />
        </AppButton>
      </div>
      <div class="flex flex-wrap gap-4 px-8 py-2">
        <AppButton class="btn-size-small btn-color-text">Cancel</AppButton>
        <AppButton class="btn-size-small btn-color-text btn-layout-outline">
          Cancel
        </AppButton>
        <AppButton class="btn-size-small btn-color-text btn-layout-invisible">
          Cancel
        </AppButton>
        <AppButton class="btn-size-small btn-color-text btn-layout-text">
          Cancel
        </AppButton>
        <AppButton class="btn-size-small btn-color-text btn-icon">
          <Icon :path="mdiTrashCan" />
        </AppButton>
        <AppButton class="btn-size-small btn-color-text btn-icon btn-rounded">
          <Icon :path="mdiTrashCan" />
        </AppButton>
      </div>
      <div class="flex flex-wrap gap-4 px-8 py-2">
        <AppInput class=""> </AppInput>
        <AppInput class="input-size-condensed"> </AppInput>
        <AppInput class="input-size-small"> </AppInput>
      </div>
      <div class="flex flex-wrap gap-4 px-8 py-2">
        <AppInput placeholder="Column" class=""> </AppInput>
        <AppInput placeholder="Column" class="input-size-condensed"> </AppInput>
        <AppInput placeholder="Column" class="input-size-small"> </AppInput>
      </div>
      <div class="flex flex-wrap gap-4 px-8 py-2">
        <AppInput label="label" placeholder="Column" class=""> </AppInput>
        <AppInput
          label="label"
          placeholder="Column"
          class="input-size-condensed"
        >
        </AppInput>
        <AppInput label="label" placeholder="Column" class="input-size-small">
        </AppInput>
      </div>
      <div class="flex flex-wrap gap-4 px-8 py-2">
        <AppAutocomplete
          v-model="selectedColumns"
          :options="columns"
          multiple
          label="label"
          placeholder="Column"
          class=""
        >
        </AppAutocomplete>
        <AppAutocomplete
          v-model="selectedColumns"
          :options="columns"
          multiple
          label="label"
          placeholder="Columns"
          name="input-size-condensed"
          class="input-size-condensed"
        >
        </AppAutocomplete>
        <AppAutocomplete
          v-model="selectedColumns"
          :options="columns"
          multiple
          label="label"
          placeholder="Columns"
          name="input-size-small"
          class="input-size-small"
        >
        </AppAutocomplete>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { mdiCheckBold, mdiTrashCan } from '@mdi/js';

import { TableSelection } from '@/types/operations';

const columns = ref([
  'firstName',
  'lastName',
  'id',
  'email',
  'phone',
  'address',
  'description',
  'city',
  'zipCode',
  'state',
  'country'
]);
const selectedColumns = ref<string[]>([]);

const columnValues = [
  { value: 1, count: 10 },
  { value: 2, count: 20 },
  { value: 3, count: 30 }
];

const otherColumnValues = [
  { value: 4, count: 40 },
  { value: 5, count: 50 },
  { value: 6, count: 60 },
  { value: 7, count: 70 },
  { value: 8, count: 60 },
  { value: 9, count: 50 },
  { value: 10, count: 30 }
];

const notColumnValues = [
  { value: 4, count: 40 },
  { value: 5, count: 50 },
  { value: 6, count: 60 },
  { value: 7, count: 70 },
  { value: 8, count: 80 },
  { value: 9, count: 90 },
  { value: 10, count: 10 }
];

const selection = ref<TableSelection>(null);
provide('selection', selection);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const hovered = ref<{ plot: string; value: any } | null>(null);
</script>

<style lang="scss"></style>
