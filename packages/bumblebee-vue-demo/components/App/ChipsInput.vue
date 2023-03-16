<template>
  <AppAutocomplete
    v-model="value"
    v-model:search="search"
    :options="null"
    multiple
    :label="label"
    :placeholder="placeholder"
    :name="name"
    class="chips-input"
  />
</template>

<script setup lang="ts">
import { PropType, ref } from 'vue';

import { RuleKey } from '@/composables/use-rules';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Value = any;

const props = defineProps({
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  modelValue: {
    type: [Object, String, Array] as PropType<Value>,
    default: () => null
  },
  search: {
    type: String,
    default: ''
  },
  textCallback: {
    type: Function as PropType<(option: unknown) => string>
  },
  rules: {
    type: Array as PropType<RuleKey[]>,
    default: () => []
  },
  name: {
    type: String,
    default: () => 'mySelector'
  },
  clearable: {
    type: Boolean,
    default: () => false
  },
  text: {
    type: String,
    default: 'text'
  }
});

type Emits = {
  (e: 'update:modelValue', value: Value, oldValue: Value): void;
  (e: 'update:search', value: Value, oldValue: Value): void;
};

const emit = defineEmits<Emits>();

const value = ref<Value>(props.modelValue);

watch(
  () => props.modelValue,
  (newValue, _oldValue) => {
    value.value = newValue;
  },
  { deep: true }
);

watch(
  () => value.value,
  (newValue, oldValue) => {
    emit('update:modelValue', newValue, oldValue);
  },
  { deep: true }
);

const search = ref(props.search);

watch(
  () => props.search,
  (newValue, _oldValue) => {
    search.value = newValue;
  }
);

watch(
  () => search.value,
  (newValue, oldValue) => {
    emit('update:search', newValue, oldValue);
  }
);
</script>
