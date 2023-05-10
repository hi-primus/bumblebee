<template>
  <AppAutocomplete
    ref="autocomplete"
    v-model="value"
    v-model:search="search"
    :options="null"
    multiple
    :label="label"
    :placeholder="placeholder"
    :name="name"
    class="chips-input"
    @validate="$event => emit('validate', $event)"
  />
</template>

<script setup lang="ts">
import { PropType, ref } from 'vue';

import Autocomplete from '@/components/App/Autocomplete.vue';
import { Rule } from '@/composables/use-rules';

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
    type: Array as PropType<Rule[]>,
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
  (e: 'validate', value: boolean | string): void;
};

const emit = defineEmits<Emits>();

const value = ref<Value>(props.modelValue);

const autocomplete = ref<InstanceType<typeof Autocomplete> | null>(null);

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

defineExpose({
  validate: (isExternalCall = false, force = false) => {
    return autocomplete.value?.validate(isExternalCall, force);
  }
});
</script>
