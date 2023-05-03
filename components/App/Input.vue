<template>
  <div
    class="input text-input"
    :class="[attrClass, errorMessage ? 'input-error' : '']"
    :style="(attrStyle as StyleValue)"
  >
    <label v-if="label" :for="name" class="label input-label text-input-label">
      {{ label }}
    </label>
    <textarea
      v-if="type === 'textarea'"
      v-model="myValue"
      :name="name"
      class="input-field text-input-field"
      :placeholder="placeholder"
      v-bind="attrs"
      @blur="validate(true)"
    >
    </textarea>
    <input
      v-else
      v-model="myValue"
      :name="name"
      :type="type"
      class="input-field text-input-field"
      :placeholder="placeholder"
      v-bind="attrs"
      @blur="validate(true)"
    />
    <span v-if="errorMessage" :class="'input-errorContainer'">
      {{ errorMessage }}
    </span>
    <slot></slot>
  </div>
</template>

<script lang="ts">
import { useField } from 'vee-validate';
import { PropType, StyleValue } from 'vue';

import { Rule } from '@/composables/use-rules';
export default {
  inheritAttrs: false
};
</script>

<script setup lang="ts">
type Emits = {
  (event: 'update:modelValue', value: string | number): void;
  (event: 'validate', value: boolean | string): void;
};

const emit = defineEmits<Emits>();

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: () => ''
  },
  label: {
    type: String,
    default: () => ''
  },
  placeholder: {
    type: String,
    default: () => ''
  },
  type: {
    type: String,
    default: () => 'text'
  },
  rules: {
    type: Array as PropType<Rule[]>,
    default: () => []
  },
  name: {
    type: String,
    default: () => 'myValue'
  }
});

const { class: attrClass, style: attrStyle, ...attrs } = useAttrs();

const myValue = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
});

const {
  errorMessage,
  value: validateValue,
  validate: validateField
} = useField(props.name, useRules(props.rules));

const validate = async (emitSignal = true) => {
  validateValue.value = myValue.value;
  await validateField();
  if (emitSignal) {
    emit('validate', errorMessage.value || false);
  }
};
</script>
