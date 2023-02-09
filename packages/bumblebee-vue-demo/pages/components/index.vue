<template>
  <NuxtLayout>
    <client-only>
      <div class="components-container pb-[500px]">
        <div
          class="flex flex-wrap gap-4 px-8 py-2 justify-start items-start min-w-[200px]"
        >
          {{ selection || 'no selection' }}
        </div>
        <div
          class="flex flex-wrap gap-4 px-8 py-2 justify-start items-start min-w-[200px]"
        >
          {{ hovered || 'no hover' }}
        </div>
        <div
          class="flex flex-wrap gap-4 px-8 py-2 justify-start items-start min-w-[200px]"
        >
          <PlotBarsBase
            column-name="test"
            :data="columnValues"
            :width="80"
            selectable
            selection-type="values"
            @hovered="
              hovered = { plot: 'columnValues', value: columnValues[$event] }
            "
          />
          <PlotBarsBase
            column-name="test2"
            :data="otherColumnValues"
            :width="80"
            selectable
            selection-type="values"
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
            selection-type="values"
            @hovered="
              hovered = {
                plot: 'notColumnValues',
                value: notColumnValues[$event]
              }
            "
          />
        </div>
        <div class="flex flex-wrap gap-4 px-8 py-2 justify-start items-start">
          <AppButton>Accept</AppButton>
          <AppButton loading>Accept</AppButton>
        </div>
        <div class="flex flex-wrap gap-4 px-8 py-2 justify-start items-start">
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
        <div class="flex flex-wrap gap-4 px-8 py-2 justify-start items-start">
          <AppButton loading>Accept</AppButton>
          <AppButton loading class="btn-layout-outline">Outline</AppButton>
          <AppButton loading class="btn-layout-invisible">Invisible</AppButton>
          <AppButton loading class="btn-layout-text">Text</AppButton>
          <AppButton loading class="btn-layout-outline btn-size-small"
            >Outline</AppButton
          >
          <AppButton loading class="btn-layout-invisible btn-size-small"
            >Invisible</AppButton
          >
          <AppButton loading class="btn-layout-text btn-size-small"
            >Text</AppButton
          >
          <AppButton loading class="btn-layout-outline btn-size-smallest"
            >Outline</AppButton
          >
          <AppButton loading class="btn-layout-invisible btn-size-smallest"
            >Invisible</AppButton
          >
          <AppButton loading class="btn-layout-text btn-size-smallest"
            >Text</AppButton
          >
          <AppButton loading class="btn-icon">
            <Icon :path="mdiCheckBold" />
          </AppButton>
          <AppButton loading class="btn-icon btn-layout-invisible">
            <Icon :path="mdiCheckBold" />
          </AppButton>
          <AppButton loading class="btn-icon btn-rounded">
            <Icon :path="mdiCheckBold" />
          </AppButton>
          <AppButton loading class="btn-icon btn-rounded btn-size-small">
            <Icon :path="mdiCheckBold" />
          </AppButton>
          <AppButton loading class="btn-icon btn-rounded btn-size-smallest">
            <Icon :path="mdiCheckBold" />
          </AppButton>
        </div>
        <div class="flex flex-wrap gap-4 px-8 py-2 justify-start items-start">
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
        <div class="flex flex-wrap gap-4 px-8 py-2 justify-start items-start">
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
        <div class="flex flex-wrap gap-4 px-8 py-2 justify-start items-start">
          <AppButton class="btn-color-error">Delete</AppButton>
          <AppButton class="btn-color-error btn-layout-outline"
            >Delete</AppButton
          >
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
        <div class="flex flex-wrap gap-4 px-8 py-2 justify-start items-start">
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
          <AppButton
            class="btn-color-text btn-icon btn-layout-invisible btn-size-smallest"
          >
            <Icon :path="mdiTrashCan" />
          </AppButton>
          <!-- small -->
        </div>
        <div class="flex flex-wrap gap-4 px-8 py-2 justify-start items-start">
          <AppButton class="btn-size-small">Accept</AppButton>
          <AppButton class="btn-size-small btn-layout-outline"
            >Outline</AppButton
          >
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
        <div class="flex flex-wrap gap-4 px-8 py-2 justify-start items-start">
          <AppButton class="btn-size-smallest">Accept</AppButton>
          <AppButton class="btn-size-smallest btn-layout-outline"
            >Outline</AppButton
          >
          <AppButton class="btn-size-smallest btn-layout-invisible">
            Invisible
          </AppButton>
          <AppButton class="btn-size-smallest btn-layout-text">Text</AppButton>
          <AppButton class="btn-size-smallest btn-icon">
            <Icon :path="mdiCheckBold" />
          </AppButton>
          <AppButton class="btn-size-smallest btn-icon btn-rounded">
            <Icon :path="mdiCheckBold" />
          </AppButton>
        </div>
        <div class="flex flex-wrap gap-4 px-8 py-2 justify-start items-start">
          <AppButton class="btn-size-small btn-color-error">Delete</AppButton>
          <AppButton class="btn-size-small btn-color-error btn-layout-outline">
            Delete
          </AppButton>
          <AppButton
            class="btn-size-small btn-color-error btn-layout-invisible"
          >
            Delete
          </AppButton>
          <AppButton class="btn-size-small btn-color-error btn-layout-text">
            Delete
          </AppButton>
          <AppButton class="btn-size-small btn-color-error btn-icon">
            <Icon :path="mdiTrashCan" />
          </AppButton>
          <AppButton
            class="btn-size-small btn-color-error btn-icon btn-rounded"
          >
            <Icon :path="mdiTrashCan" />
          </AppButton>
        </div>
        <div class="flex flex-wrap gap-4 px-8 py-2 justify-start items-start">
          <AppButton class="btn-size-small btn-color-primary-light"
            >Dismiss</AppButton
          >
          <AppButton
            class="btn-size-small btn-color-primary-light btn-layout-outline"
          >
            Dismiss
          </AppButton>
          <AppButton
            class="btn-size-small btn-color-primary-light btn-layout-invisible"
          >
            Dismiss
          </AppButton>
          <AppButton
            class="btn-size-small btn-color-primary-light btn-layout-text"
          >
            Dismiss
          </AppButton>
          <AppButton class="btn-size-small btn-color-primary-light btn-icon">
            <Icon :path="mdiTrashCan" />
          </AppButton>
          <AppButton
            class="btn-size-small btn-color-primary-light btn-icon btn-rounded"
          >
            <Icon :path="mdiTrashCan" />
          </AppButton>
        </div>
        <div class="flex flex-wrap gap-4 px-8 py-2 justify-start items-start">
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
        <div
          class="flex flex-wrap gap-4 px-8 py-2 justify-start items-start max-w-[320px] bg-primary-highlight"
        >
          <AppButton class="btn-color-error w-full">Cancel</AppButton>
        </div>
        <div class="flex flex-wrap gap-4 px-8 py-2 justify-start items-start">
          <AppInput class=""> </AppInput>
          <AppInput class="input-size-condensed"> </AppInput>
          <AppInput class="input-size-small"> </AppInput>
        </div>
        <div class="flex flex-wrap gap-4 px-8 py-2 justify-start items-start">
          <AppInput placeholder="Column" class=""> </AppInput>
          <AppInput placeholder="Column" class="input-size-condensed">
          </AppInput>
          <AppInput placeholder="Column" class="input-size-small"> </AppInput>
        </div>
        <div class="flex flex-wrap gap-4 px-8 py-2 justify-start items-start">
          <AppInput label="Test input" placeholder="Column" class="">
          </AppInput>
          <AppInput
            label="Test input"
            placeholder="Column"
            class="input-size-condensed"
          >
          </AppInput>
          <AppInput
            label="Test input"
            placeholder="Column"
            class="input-size-small"
          >
          </AppInput>
        </div>
        <div class="flex flex-wrap gap-4 px-8 py-2 justify-start items-start">
          <AppAutocomplete
            v-model="selectedColumns"
            :options="columns"
            multiple
            label="Test multiple autocomplete"
            placeholder="Column"
            class=""
          >
          </AppAutocomplete>
          <AppAutocomplete
            v-model="selectedColumns"
            v-model:search="search"
            :options="columns"
            multiple
            label="Test multiple autocomplete"
            placeholder="Column"
            class=""
          >
          </AppAutocomplete>
          <AppAutocomplete
            v-model="selectedColumn"
            v-model:search="search"
            :options="columns"
            label="Test autocomplete"
            placeholder="Columns"
            name="input-size-condensed"
            class="input-size-condensed"
          >
          </AppAutocomplete>
          <AppAutocomplete
            v-model="selectedColumns"
            v-model:search="search"
            :options="columns"
            multiple
            label="Test multiple autocomplete"
            placeholder="Columns"
            name="input-size-small"
            class="input-size-small"
          >
          </AppAutocomplete>
          search: {{ search }}
        </div>
        <div class="flex flex-wrap gap-4 px-8 py-2 justify-start items-start">
          <AppChipsInput
            v-model="replaces"
            label="Test multiple chips"
            placeholder="Column"
            class=""
          >
          </AppChipsInput>
          <AppChipsInput
            v-model="replaces"
            label="Test multiple chips"
            placeholder="Columns"
            name="input-size-small"
            class="input-size-small"
          >
          </AppChipsInput>
        </div>
        <div class="flex flex-wrap gap-4 px-8 py-2 justify-start items-start">
          <AppSelector
            v-model="selectedColumns"
            :options="columns"
            multiple
            label="Test multiple selector"
            placeholder="Column"
            class="min-w-[320px]"
          >
          </AppSelector>
          <AppSelector
            v-model="selectedColumn"
            :options="columns"
            label="Test selector"
            placeholder="Columns"
            name="input-size-condensed"
            class="input-size-condensed min-w-[320px]"
          >
          </AppSelector>
          <AppSelector
            v-model="selectedColumns"
            :options="columns"
            multiple
            label="Test multiple selector"
            placeholder="Columns"
            name="input-size-small"
            class="input-size-small min-w-[320px]"
          >
          </AppSelector>
        </div>
      </div>
    </client-only>
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
const replaces = ref<string[]>([]);
const selectedColumn = ref<string>('');
const search = ref<string>('');

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
