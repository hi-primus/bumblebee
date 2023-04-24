<template>
  <component
    :is="element"
    class="editable-element"
    contenteditable
    spellcheck="false"
    @blur="update"
  >
    {{ modelValue }}
  </component>
</template>

<script setup lang="ts">
const props = defineProps({
  element: {
    type: String,
    default: 'div'
  },
  modelValue: {
    type: String,
    default: ''
  }
});

type Emits = {
  (e: 'update:modelValue', value: string, oldValue: string | undefined): void;
};

const emit = defineEmits<Emits>();

const update = (e: Event) => {
  const target = e.target as HTMLElement;
  const value = target.innerText;
  emit('update:modelValue', value, props.modelValue);
};
</script>
