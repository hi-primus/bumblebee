<template>
  <div :class="[attrClass, style.classes.container]" :style="attrStyle">
    <input
      :name="name"
      v-model="checked"
      type="checkbox"
      :class="style.classes.input"
      v-bind="attrs"
    />
    <label :for="name" :class="style.classes.label" class="my-auto">
      {{ label }}
    </label>
  </div>
</template>

<script>
export default {
  inheritAttrs: false
};
</script>

<script setup>
import { getThemeProps, useTheme, useThemeStyle } from '@/composables/themes';

const emit = defineEmits(['update:modelValue', 'isValid']);

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  label: {
    type: String,
    default: () => ''
  },
  name: {
    type: String,
    default: () => 'myValue'
  },
  ...getThemeProps('checkbox')
});

const { class: attrClass, style: attrStyle, ...attrs } = useAttrs();

const theme = useTheme(props.theme);

const style = useThemeStyle(
  theme,
  props.variant || props.type,
  'input',
  'Input',
  props.classes,
  props.icons
);

const checked = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
});
</script>
