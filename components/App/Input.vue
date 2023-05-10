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
      @blur="validate()"
      @update:model-value="validate()"
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
      @blur="validate()"
      @update:model-value="validate()"
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
} = useField(props.name, useRules(props.rules), { pause: true });

let hasValidated = false;

const validate = (isExternalCall = false, force = false) => {
  validateValue.value = myValue.value;
  if (!isExternalCall || hasValidated || force) {
    hasValidated = true;
    validateField();
  }
  if (!isExternalCall) {
    emit('validate', errorMessage.value || false);
  }
};

defineExpose({
  validate
});
</script>
