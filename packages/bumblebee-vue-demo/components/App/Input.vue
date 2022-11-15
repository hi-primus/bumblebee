<template>
  <div :class="[attrClass, style.classes.container]" :style="attrStyle">
    <label v-if="label" :for="name" class="label" :class="style.classes.label">
      {{ label }}
    </label>
    <textarea
      v-if="type === 'textarea'"
      v-model="myValue"
      :name="name"
      :class="[
        style.classes.field,
        errorMessage ? style.classes.errorInput : ''
      ]"
      :placeholder="placeholder"
      :rows="rows"
      :autocomplete="autocomplete"
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
        style.classes.field,
        errorMessage ? style.classes.errorInput : ''
      ]"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      @blur="isValid"
      v-bind="attrs"
    />
    <span v-if="errorMessage" :class="style.classes.errorContainer">
      {{ errorMessage }}
    </span>
  </div>
</template>

<script>
export default {
  inheritAttrs: false
}
</script>

<script setup>
import { useField } from 'vee-validate'
// import { isRequired } from "@/composables/rules";
import { inputAutoNone } from '@/utils'

import { getThemeProps, useTheme, useThemeStyle } from '@/composables/themes'

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
    type: Array,
    default: () => []
  },
  name: {
    type: String,
    default: () => 'myValue'
  },
  rows: {
    type: Number,
    default: () => 1
  },
  autocomplete: {
    type: String,
    default: () => inputAutoNone()
  },
  // disabled: {
  //   type: Boolean,
  //   default: () => false
  // },
  ...getThemeProps(null)
})

const { class: attrClass, style: attrStyle, ...attrs } = useAttrs()

const theme = useTheme(props.theme)

const style = useThemeStyle(
  theme,
  props.variant || props.type,
  'input',
  'Input',
  props.classes,
  props.icons
)

const myValue = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

const rules = computed(() => {
  const useRules = []

  for (let i = 0; i < props.rules.length; i++) {
    const rule = props.rules[i]
    switch (rule) {
      case 'required':
        useRules.push(isRequired)
        break
      case 'email':
        useRules.push(isEmail)
        break
    }
  }

  return useRules
})

const {
  errorMessage,
  value: validateValue,
  validate
} = useField(props.name, rules.value)

const isValid = async () => {
  validateValue.value = myValue.value
  const result = await validate()
  emit('isValid', result)
}
</script>
