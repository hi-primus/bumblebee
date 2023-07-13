<template>
  <draggable
    v-model="myValue"
    tag="ul"
    class="columns-sort-component w-full flex flex-col gap-2 items-stretch"
  >
    <template #item="{ element }">
      <li
        class="flex items-center gap-2 cursor-move bg-primary-highlight rounded pl-6 pr-2 py-1"
      >
        <ColumnTypeHint
          class="text-neutral-alpha text-left w-[2em]"
          :data-type="typesMap[element] || 'unknown'"
        />
        <span class="font-mono text-neutral">
          {{ element }}
        </span>
      </li>
    </template>
  </draggable>
</template>

<script setup lang="ts">
import { PropType } from 'vue';

import { DataframeObject } from '@/types/dataframe';
import { OperationPayload, PayloadWithOptions } from '@/types/operations';
import { getType } from '@/utils/data-types';

const props = defineProps({
  modelValue: {
    type: Object as PropType<string[]>
  }
});

type Emits = {
  (e: 'update:modelValue', value: string[]): void;
};

const emit = defineEmits<Emits>();

const operationValues = inject('operation-values') as Ref<
  OperationPayload<PayloadWithOptions>
>;

const initialValue =
  props.modelValue || operationValues.value?.allColumns || [];

const myValue = ref<string[]>(initialValue);

watch(
  () => props.modelValue,
  value => {
    myValue.value = value || [];
  }
);

watch(
  () => myValue.value,
  value => {
    emit('update:modelValue', value);
  }
);

const dataframeObject = inject(
  'dataframe-object'
) as ComputedRef<DataframeObject>;

const typesMap = computed(() => {
  const typesMap: Record<string, string> = {};
  Object.entries(dataframeObject.value?.profile?.columns || {}).forEach(
    ([key, column]) => {
      typesMap[key] = getType(column);
    }
  );
  return typesMap;
});
</script>
