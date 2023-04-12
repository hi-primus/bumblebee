<template>
  <NuxtLayout>
    <client-only>
      <div class="components-container pb-[500px]">
        <div
          class="flex flex-wrap gap-4 px-8 py-2 justify-start items-start min-w-[200px]"
        >
          <AppFile
            v-model="file"
            class="min-w-[320px]"
            label="File"
            placeholder="Select a CSV file"
            name="file"
          />
          file: {{ file }}
          <AppFile
            v-model="file"
            class="min-w-[320px]"
            label="File"
            placeholder="Select a CSV file"
            name="file"
            :clearable="false"
          />
          file: {{ file }}
        </div>
        <div
          v-show="false"
          class="flex flex-wrap gap-4 px-8 py-2 justify-start items-start min-w-[200px]"
        >
          {{ selection || 'no selection' }}
        </div>
        <div
          v-show="false"
          class="flex flex-wrap gap-4 px-8 py-2 justify-start items-start min-w-[200px]"
        >
          {{ hovered || 'no hover' }}
        </div>
        <div
          v-show="false"
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
        <div
          class="flex flex-wrap gap-4 px-8 py-2 justify-start items-start min-w-[200px]"
        >
          <AppButton
            v-tooltip:bottom.primary.lg.follow-x="
              'Large tooltip at bottom, follows cursor'
            "
          >
            Accept
          </AppButton>
          <AppButton v-tooltip:bottom.primary.lg="'Same as before but static'">
            Accept
          </AppButton>
          <AppButton v-tooltip:top.warning.md="'Warning'"> Accept </AppButton>
          <div
            v-tooltip:bottom.error.xl="'Button is disabled!'"
            class="cursor-not-allowed"
          >
            <AppButton disabled> Accept </AppButton>
          </div>
          <AppButton
            class="color-primary"
            v-tooltip:left.success.sm.follow="'Successful test'"
          >
            Done
            <Icon :path="mdiCheckBold" />
          </AppButton>
          <AppButton
            v-tooltip:right.invalid-modifier.follow-y="'Check console log'"
          >
            Regular tooltip
          </AppButton>
        </div>
        <div class="flex flex-wrap gap-4 px-8 py-2 justify-start items-start">
          <AppButton>Accept</AppButton>
          <AppButton loading>Accept</AppButton>
        </div>
        <div class="flex flex-wrap gap-4 px-8 py-2 justify-start items-start">
          <AppButton>Accept</AppButton>
          <AppButton class="layout-outline">Outline</AppButton>
          <AppButton class="layout-invisible">Invisible</AppButton>
          <AppButton class="layout-text">Text</AppButton>
          <AppButton class="icon-button">
            <Icon :path="mdiCheckBold" />
          </AppButton>
          <AppButton class="icon-button layout-invisible">
            <Icon :path="mdiCheckBold" />
          </AppButton>
          <AppButton class="icon-button rounded-button">
            <Icon :path="mdiCheckBold" />
          </AppButton>
        </div>
        <div class="flex flex-wrap gap-4 px-8 py-2 justify-start items-start">
          <AppButton loading>Accept</AppButton>
          <AppButton loading class="layout-outline">Outline</AppButton>
          <AppButton loading class="layout-invisible">Invisible</AppButton>
          <AppButton loading class="layout-text">Text</AppButton>
          <AppButton loading class="layout-outline size-small"
            >Outline</AppButton
          >
          <AppButton loading class="layout-invisible size-small"
            >Invisible</AppButton
          >
          <AppButton loading class="layout-text size-small">Text</AppButton>
          <AppButton loading class="layout-outline size-smallest"
            >Outline</AppButton
          >
          <AppButton loading class="layout-invisible size-smallest"
            >Invisible</AppButton
          >
          <AppButton loading class="layout-text size-smallest">Text</AppButton>
          <AppButton loading class="icon-button">
            <Icon :path="mdiCheckBold" />
          </AppButton>
          <AppButton loading class="icon-button layout-invisible">
            <Icon :path="mdiCheckBold" />
          </AppButton>
          <AppButton loading class="icon-button rounded-button">
            <Icon :path="mdiCheckBold" />
          </AppButton>
          <AppButton loading class="icon-button rounded-button size-small">
            <Icon :path="mdiCheckBold" />
          </AppButton>
          <AppButton loading class="icon-button rounded-button size-smallest">
            <Icon :path="mdiCheckBold" />
          </AppButton>
        </div>
        <div class="flex flex-wrap gap-4 px-8 py-2 justify-start items-start">
          <AppButton disabled>Accept</AppButton>
          <AppButton disabled class="layout-outline">Outline</AppButton>
          <AppButton disabled class="layout-invisible">Invisible</AppButton>
          <AppButton disabled class="layout-text">Text</AppButton>
          <AppButton disabled class="icon-button">
            <Icon :path="mdiCheckBold" />
          </AppButton>
          <AppButton disabled class="icon-button layout-invisible">
            <Icon :path="mdiCheckBold" />
          </AppButton>
          <AppButton disabled class="icon-button rounded-button">
            <Icon :path="mdiCheckBold" />
          </AppButton>
        </div>
        <div class="flex flex-wrap gap-4 px-8 py-2 justify-start items-start">
          <AppButton class="rounded-button">Accept</AppButton>
          <AppButton class="rounded-button layout-outline">Outline</AppButton>
          <AppButton class="rounded-button layout-invisible">
            Invisible
          </AppButton>
          <AppButton class="rounded-button layout-text">Text</AppButton>
          <AppButton class="rounded-button icon-button">
            <Icon :path="mdiCheckBold" />
          </AppButton>
          <AppButton class="icon-button layout-invisible">
            <Icon :path="mdiCheckBold" />
          </AppButton>
          <AppButton class="icon-button rounded-button">
            <Icon :path="mdiCheckBold" />
          </AppButton>
        </div>
        <div class="flex flex-wrap gap-4 px-8 py-2 justify-start items-start">
          <AppButton class="color-danger">Delete</AppButton>
          <AppButton class="color-danger layout-outline">Delete</AppButton>
          <AppButton class="color-danger layout-invisible"> Delete </AppButton>
          <AppButton class="color-danger layout-text">Delete</AppButton>
          <AppButton class="color-danger icon-button">
            <Icon :path="mdiTrashCan" />
          </AppButton>
          <AppButton class="color-danger icon-button rounded-button">
            <Icon :path="mdiTrashCan" />
          </AppButton>
        </div>
        <div class="flex flex-wrap gap-4 px-8 py-2 justify-start items-start">
          <AppButton class="color-neutral"> Cancel </AppButton>
          <AppButton class="color-neutral layout-outline"> Cancel </AppButton>
          <AppButton class="color-neutral layout-invisible"> Cancel </AppButton>
          <AppButton class="color-neutral layout-text"> Cancel </AppButton>
          <AppButton class="color-neutral icon-button">
            <Icon :path="mdiTrashCan" />
          </AppButton>
          <AppButton class="color-neutral icon-button rounded-button">
            <Icon :path="mdiTrashCan" />
          </AppButton>
          <AppButton class="color-neutral icon-button layout-invisible">
            <Icon :path="mdiTrashCan" />
          </AppButton>
          <AppButton
            class="color-neutral icon-button layout-invisible size-small"
          >
            <Icon :path="mdiTrashCan" />
          </AppButton>
          <AppButton
            class="color-neutral icon-button layout-invisible size-smallest"
          >
            <Icon :path="mdiTrashCan" />
          </AppButton>
          <!-- small -->
        </div>
        <div class="flex flex-wrap gap-4 px-8 py-2 justify-start items-start">
          <AppButton class="size-small">Accept</AppButton>
          <AppButton class="size-small layout-outline">Outline</AppButton>
          <AppButton class="size-small layout-invisible"> Invisible </AppButton>
          <AppButton class="size-small layout-text">Text</AppButton>
          <AppButton class="size-small icon-button">
            <Icon :path="mdiCheckBold" />
          </AppButton>
          <AppMenu
            :items="[
              { text: 'Item 1' },
              { text: 'Item 2' },
              { text: 'Item 3' }
            ]"
          >
            <AppButton class="size-small icon-button rounded-button relative">
              <Icon :path="mdiMore" />
            </AppButton>
          </AppMenu>
        </div>
        <div class="flex flex-wrap gap-4 px-8 py-2 justify-start items-start">
          <AppButton class="size-smallest">Accept</AppButton>
          <AppButton class="size-smallest layout-outline">Outline</AppButton>
          <AppButton class="size-smallest layout-invisible">
            Invisible
          </AppButton>
          <AppButton class="size-smallest layout-text">Text</AppButton>
          <AppButton class="size-smallest icon-button">
            <Icon :path="mdiCheckBold" />
          </AppButton>
          <AppButton class="size-smallest icon-button rounded-button">
            <Icon :path="mdiCheckBold" />
          </AppButton>
        </div>
        <div class="flex flex-wrap gap-4 px-8 py-2 justify-start items-start">
          <AppButton class="size-small color-danger">Delete</AppButton>
          <AppButton class="size-small color-danger layout-outline">
            Delete
          </AppButton>
          <AppButton class="size-small color-danger layout-invisible">
            Delete
          </AppButton>
          <AppButton class="size-small color-danger layout-text">
            Delete
          </AppButton>
          <AppButton class="size-small color-danger icon-button">
            <Icon :path="mdiTrashCan" />
          </AppButton>
          <AppButton class="size-small color-danger icon-button rounded-button">
            <Icon :path="mdiTrashCan" />
          </AppButton>
        </div>
        <div class="flex flex-wrap gap-4 px-8 py-2 justify-start items-start">
          <AppButton class="size-small color-primary-light">Dismiss</AppButton>
          <AppButton class="size-small color-primary-light layout-outline">
            Dismiss
          </AppButton>
          <AppButton class="size-small color-primary-light layout-invisible">
            Dismiss
          </AppButton>
          <AppButton class="size-small color-primary-light layout-text">
            Dismiss
          </AppButton>
          <AppButton class="size-small color-primary-light icon-button">
            <Icon :path="mdiTrashCan" />
          </AppButton>
          <AppButton
            class="size-small color-primary-light icon-button rounded-button"
          >
            <Icon :path="mdiTrashCan" />
          </AppButton>
        </div>
        <div class="flex flex-wrap gap-4 px-8 py-2 justify-start items-start">
          <AppButton class="size-small color-neutral">Cancel</AppButton>
          <AppButton class="size-small color-neutral layout-outline">
            Cancel
          </AppButton>
          <AppButton class="size-small color-neutral layout-invisible">
            Cancel
          </AppButton>
          <AppButton class="size-small color-neutral layout-text">
            Cancel
          </AppButton>
          <AppButton class="size-small color-neutral icon-button">
            <Icon :path="mdiTrashCan" />
          </AppButton>
          <AppButton
            class="size-small color-neutral icon-button rounded-button"
          >
            <Icon :path="mdiTrashCan" />
          </AppButton>
        </div>
        <div
          class="flex flex-wrap gap-4 px-8 py-2 justify-start items-start max-w-[320px] bg-primary-highlight"
        >
          <AppButton class="color-danger w-full">Cancel</AppButton>
        </div>
        <div class="flex flex-wrap gap-4 px-8 py-2 justify-start items-start">
          <AppInput class=""> </AppInput>
          <AppInput class="size-condensed"> </AppInput>
          <AppInput class="size-small"> </AppInput>
        </div>
        <div class="flex flex-wrap gap-4 px-8 py-2 justify-start items-start">
          <AppInput placeholder="Column" class=""> </AppInput>
          <AppInput placeholder="Column" class="size-condensed"> </AppInput>
          <AppInput placeholder="Column" class="size-small"> </AppInput>
        </div>
        <div class="flex flex-wrap gap-4 px-8 py-2 justify-start items-start">
          <AppInput label="Test input" placeholder="Column" class="">
          </AppInput>
          <AppInput
            label="Test input"
            placeholder="Column"
            class="size-condensed"
          >
          </AppInput>
          <AppInput label="Test input" placeholder="Column" class="size-small">
          </AppInput>
        </div>
        <div class="flex flex-wrap gap-4 px-8 py-2 justify-start items-start">
          <AppInput label="Test input" placeholder="Column" class="field-mono">
          </AppInput>
          <AppInput
            label="Test input"
            placeholder="Column"
            class="field-mono size-condensed"
          >
          </AppInput>
          <AppInput
            label="Test input"
            placeholder="Column"
            class="field-mono size-small"
          >
          </AppInput>
        </div>
        <div class="flex flex-wrap gap-4 px-8 py-2 justify-start items-start">
          selectedColumns: {{ selectedColumns }} selectedColumn:
          {{ selectedColumn }}
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
            name="size-condensed"
            class="size-condensed"
            clearable
          >
          </AppAutocomplete>
          <AppAutocomplete
            v-model="selectedColumns"
            v-model:search="search"
            :options="columns"
            multiple
            label="Test multiple autocomplete"
            placeholder="Column"
            class="field-mono"
          >
          </AppAutocomplete>
          <AppAutocomplete
            v-model="selectedColumn"
            v-model:search="search"
            :options="columns"
            label="Test autocomplete"
            placeholder="Columns"
            name="size-condensed"
            class="field-mono size-condensed"
            clearable
          >
          </AppAutocomplete>
          <AppAutocomplete
            v-model="selectedColumns"
            v-model:search="search"
            :options="columns"
            multiple
            label="Test multiple autocomplete"
            placeholder="Columns"
            name="size-small"
            class="size-small"
          >
          </AppAutocomplete>
          search: {{ search }}
        </div>
        <div
          class="flex flex-wrap gap-4 px-8 py-2 justify-start items-start bg-primary-highlight"
        >
          selectedColumnsValues:
          {{ selectedColumnsValues }} selectedColumnValue:
          {{ selectedColumnValue }}
        </div>
        <div
          class="flex flex-wrap gap-4 px-8 py-2 justify-start items-start bg-primary-highlight"
        >
          <AppAutocomplete
            v-model="selectedColumnsValues"
            :options="columnsValues"
            multiple
            label="Test multiple autocomplete"
            placeholder="Column"
            class=""
          >
          </AppAutocomplete>
          <AppAutocomplete
            v-model="selectedColumnsValues"
            v-model:search="search"
            :options="columnsValues"
            multiple
            label="Test multiple autocomplete"
            placeholder="Column"
            class=""
          >
          </AppAutocomplete>
          <AppAutocomplete
            v-model="selectedColumnValue"
            v-model:search="search"
            :options="columnsValues"
            label="Test autocomplete"
            placeholder="Columns"
            name="size-condensed"
            class="size-condensed"
            clearable
          >
          </AppAutocomplete>
          <AppAutocomplete
            v-model="selectedColumnsValues"
            v-model:search="search"
            :options="columnsValues"
            multiple
            label="Test multiple autocomplete"
            placeholder="Column"
            class="field-mono"
          >
          </AppAutocomplete>
          <AppAutocomplete
            v-model="selectedColumnValue"
            v-model:search="search"
            :options="columnsValues"
            label="Test autocomplete"
            placeholder="Columns"
            name="size-condensed"
            class="field-mono size-condensed"
            clearable
          >
          </AppAutocomplete>
          <AppAutocomplete
            v-model="selectedColumnsValues"
            v-model:search="search"
            :options="columnsValues"
            multiple
            label="Test multiple autocomplete"
            placeholder="Columns"
            name="size-small"
            class="size-small"
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
            name="size-small"
            class="size-small"
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
            name="size-condensed"
            class="size-condensed min-w-[320px]"
          >
          </AppSelector>
          <AppSelector
            v-model="selectedColumns"
            :options="columns"
            multiple
            label="Test multiple selector"
            placeholder="Column"
            class="min-w-[320px] field-mono"
          >
          </AppSelector>
          <AppSelector
            v-model="selectedColumn"
            :options="columns"
            label="Test selector"
            placeholder="Columns"
            name="size-condensed"
            class="size-condensed min-w-[320px] field-mono"
          >
          </AppSelector>
          <AppSelector
            v-model="selectedColumns"
            :options="columns"
            multiple
            label="Test multiple selector"
            placeholder="Columns"
            name="size-small"
            class="size-small min-w-[320px]"
          >
          </AppSelector>
        </div>
      </div>
    </client-only>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { mdiCheckBold, mdiMore, mdiTrashCan } from '@mdi/js';

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
const columnsValues = ref([
  { text: 'firstName', value: 'firstName' },
  { text: 'lastName', value: 'lastName' },
  { text: 'id', value: 'id' },
  { text: 'email', value: 'email' },
  { text: 'phone', value: 'phone' },
  { text: 'address', value: 'address' },
  { text: 'description', value: 'description' },
  { text: 'city', value: 'city' },
  { text: 'zipCode', value: 'zipCode' },
  { text: 'state', value: 'state' },
  { text: 'country', value: 'country' }
]);
const selectedColumns = ref<string[]>([]);
const replaces = ref<string[]>([]);
const selectedColumn = ref<string>('');
const selectedColumnsValues = ref<string[]>([]);
const selectedColumnValue = ref<string>('');
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

const file = ref<File | undefined>(undefined);
</script>

<style lang="scss"></style>
