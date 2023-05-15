<template>
  <component
    :is="element"
    ref="htmlElement"
    class="editable-element"
    contenteditable
    spellcheck="false"
    @blur="update"
    @keydown.enter.prevent="blur"
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

const htmlElement = ref<HTMLElement | null>(null);

const update = (e: Event) => {
  const target = e.target as HTMLElement;
  const value = target.innerText;
  emit('update:modelValue', value, props.modelValue);
};

const blur = () => {
  htmlElement.value?.blur();
};

defineExpose({
  focus: () => {
    htmlElement.value?.focus();
  },
  focusAndSelect: () => {
    htmlElement.value?.focus();
    if (htmlElement.value && window?.getSelection) {
      const range = document.createRange();
      range.selectNodeContents(htmlElement.value);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
    }
  }
});
</script>
