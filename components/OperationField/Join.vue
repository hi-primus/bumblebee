<template>
  <div
    class="grid grid-cols-2 overflow-y-auto max-h-96 relative -mx-2 w-[calc(100%+1rem)] items-start"
  >
    <div
      v-for="side in (['left', 'right'] as const)"
      :key="side"
      class="sticky top-0 flex flex-col"
    >
      <div
        v-if="value?.[side]"
        class="sticky top-0 bg-white z-[5] group flex items-center h-8 px-2"
        :class="{
          'pr-4': side === 'right',
          'pl-4': side === 'left'
        }"
      >
        <IconButton
          class="h-5 w-5 transition-all text-neutral-alpha opacity-70"
          :path="
            value[side].every(col => col.selected)
              ? mdiCheckboxMarked
              : mdiCheckboxBlankOutline
          "
          @click="_event => toggleSide(side)"
        />
        <span class="font-bold text-sm text-neutral-lighter pl-9"
          ><span class="capitalize">{{ side }}</span> columns</span
        >
      </div>
      <div
        v-for="(col, index) in value?.[side]"
        :key="side + col.name"
        class="group flex gap-2 items-center h-8 px-2"
        :class="{
          'bg-green-highlight': col.isKey,
          'bg-yellow-highlight': !col.isKey && side === 'left',
          'bg-blue-highlight': !col.isKey && side === 'right',
          'pr-4': side === 'right',
          'pl-4': side === 'left'
        }"
      >
        <IconButton
          class="h-5 w-5 transition-all text-neutral-alpha opacity-70"
          :path="col.selected ? mdiCheckboxMarked : mdiCheckboxBlankOutline"
          @click="_event => toggleSelected(side, index)"
        />
        <IconButton
          class="h-5 w-5 transition-all"
          :class="[
            col.isKey
              ? 'text-neutral-alpha opacity-70'
              : 'text-neutral-alpha opacity-0 group-hover:opacity-50 focus:opacity-50'
          ]"
          :path="mdiKey"
          @click="_event => setKey(side, index)"
        />
        <span class="text-neutral-light">{{ col.name }} </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { mdiCheckboxBlankOutline, mdiCheckboxMarked, mdiKey } from '@mdi/js';
import { PropType, Ref } from 'vue';

import {
  JoinData,
  OperationPayload,
  PayloadWithOptions
} from '@/types/operations';

const emit = defineEmits(['update:modelValue', 'isValid']);

const props = defineProps({
  modelValue: {
    type: Object as PropType<JoinData | null>,
    default: null
  }
});

const operationValues = inject('operation-values') as Ref<
  OperationPayload<PayloadWithOptions>
>;

const getDefaultValue = (): JoinData => {
  const payload = operationValues.value;
  const rightColumns =
    payload.allDataframes?.find(df => df.name === payload.dfRightName)
      ?.columns || [];
  const leftColumns = payload.allColumns || [];
  const value = {
    left: leftColumns.map(col => ({
      name: col,
      selected: true,
      isKey: false
    })),
    right: rightColumns.map(col => ({
      name: col,
      selected: true,
      isKey: false
    }))
  };
  const leftKeys = value.left.filter(col => col.selected).map(col => col.name);
  const rightKeys = value.right
    .filter(col => col.selected)
    .map(col => col.name);
  const commonKeys = leftKeys.filter(key => rightKeys.includes(key));
  if (commonKeys.length) {
    const commonKey = commonKeys[0];
    for (const side of ['left', 'right'] as const) {
      const col = value[side].find(col => col.name === commonKey);
      if (col) {
        col.isKey = true;
      }
    }
  }
  return value;
};

const value = ref<JoinData>(props.modelValue || getDefaultValue());

watch(
  () => props.modelValue,
  (newValue, _oldValue) => {
    newValue && (value.value = newValue);
  },
  { deep: true }
);

watch(
  () => value.value,
  (newValue, oldValue) => {
    emit('update:modelValue', newValue, oldValue);
  },
  { deep: true, immediate: true }
);

let mutating = false;

const toggleSide = async (side: 'left' | 'right') => {
  if (mutating) {
    return;
  }
  mutating = true;
  await nextTick();
  if (!value.value) {
    value.value = getDefaultValue();
  }
  if (value.value[side].every(c => c.selected)) {
    value.value[side] = value.value[side].map(c => ({
      ...c,
      selected: c.isKey
    }));
  } else {
    value.value[side] = value.value[side].map(c => ({ ...c, selected: true }));
  }
  mutating = false;
};

const toggleSelected = async (side: 'left' | 'right', index: number) => {
  if (mutating) {
    return;
  }
  mutating = true;
  await nextTick();
  if (!value.value) {
    value.value = getDefaultValue();
  }
  value.value[side][index].selected = !value.value[side][index].selected;
  mutating = false;
};

const setKey = async (side: 'left' | 'right', index: number) => {
  if (mutating) {
    return;
  }
  mutating = true;
  await nextTick();
  if (!value.value) {
    value.value = getDefaultValue();
  }
  if (value.value[side][index].isKey) {
    return;
  }
  value.value[side] = value.value[side].map((c, i) => ({
    ...c,
    selected: c.selected || i === index,
    isKey: i === index
  }));
  mutating = false;
};
</script>
