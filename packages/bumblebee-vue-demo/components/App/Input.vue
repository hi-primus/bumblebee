<template>
  <div :class="[attrClass, 'text-input']" :style="(attrStyle as StyleValue)">
    <label v-if="label" :for="name" class="label" :class="'text-input-label'">
      {{ label }}
    </label>
    <textarea
      v-if="type === 'textarea'"
      v-model="myValue"
      :name="name"
      :class="[
        'text-input-field',
        errorMessage ? 'text-input-errorInput' : ''
      ]"
      :placeholder="placeholder"
      @blur="isValid"
      v-bind="attrs"
    >
    </textarea>
    <input
      v-else
      v-model="myValue"
      :name="name"
      :type="type"
      :class="[
        'text-input-field',
        errorMessage ? 'text-input-errorInput' : ''
      ]"
      :placeholder="placeholder"
      @blur="isValid"
      v-bind="attrs"
    />
    <span v-if="errorMessage" :class="'text-input-errorContainer'">
      {{ errorMessage }}
    </span>
  </div>
</template>

<script lang="ts">
export default {
  inheritAttrs: false
}
</script>

<script setup lang="ts">
import { useField } from 'vee-validate'
// import { isRequired } from "@/composables/rules";
import { inputAutoNone } from '@/utils'
import { RuleKey } from '@/composables/use-rules';
import { PropType } from 'vue';

const emit = defineEmits(['update:modelValue', 'isValid'])

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
    type: Array as PropType<RuleKey[]>,
    default: () => []
  },
  name: {
    type: String,
    default: () => 'myValue'
  },
})

const { class: attrClass, style: attrStyle, ...attrs } = useAttrs()

const myValue = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
});

const {
  errorMessage,
  value: validateValue,
  validate
} = useField(props.name, useRules(props.rules));

const isValid = async () => {
  validateValue.value = myValue.value
  const result = await validate()
  emit('isValid', result)
}
</script>
