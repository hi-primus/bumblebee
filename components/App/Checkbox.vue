<template>
  <div class="checkbox" :class="[attrClass]" :style="(attrStyle as StyleValue)">
    <input
      v-model="checked"
      :name="name"
      type="checkbox"
      class="checkbox-input"
      v-bind="attrs"
    />
    <label :for="name" class="checkbox-label my-auto">
      {{ label }}
    </label>
  </div>
</template>

<script lang="ts">
import { StyleValue } from 'vue';
export default {
  inheritAttrs: false
};
</script>

<script setup lang="ts">
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
  }
});

const { class: attrClass, style: attrStyle, ...attrs } = useAttrs();

const checked = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
});
</script>
