<template>
  <div class="slider-container" :class="attrClass" :style="attrStyle">
    <Slider
      class="slider"
      v-bind="{ ...attrs, modelValue: value }"
      show-tooltip="drag"
      :step="0"
      @update:model-value="($event: number) => value = $event"
    />
  </div>
</template>

<script lang="ts">
import Slider from '@vueform/slider';
export default {
  inheritAttrs: false
};
</script>

<script setup lang="ts">
const { class: attrClass, style: attrStyle, ...attrs } = useAttrs();

const props = defineProps({
  modelValue: {
    type: Number,
    required: true
  },
  step: {
    type: Number,
    default: 1
  }
});

type Emits = {
  (event: 'update:modelValue', value: number): void;
};

const emit = defineEmits<Emits>();

const closestToStep = (value: number, step = 1) => {
  return Math.round(value / step) * step;
};

const value = ref(props.modelValue);

watch(
  () => props.modelValue,
  newValue => {
    value.value = newValue;
  }
);

watch(value, async () => {
  const finalValue = closestToStep(value.value, props.step);
  await nextTick();
  if (value.value !== finalValue) {
    value.value = finalValue;
  }
  if (finalValue !== props.modelValue) {
    emit('update:modelValue', finalValue);
  }
});
</script>

<style src="@vueform/slider/themes/default.css"></style>

<style lang="scss">
.slider-container {
  @apply h-4;
  --slider-bg: theme('colors.gray.light');
  --slider-connect-bg: theme('colors.primary.DEFAULT');
  --slider-connect-bg-disabled: theme('colors.gray.lighter');
  --slider-height: 8px;
  --slider-radius: 9999px;

  --slider-handle-bg: theme('colors.white');

  --slider-handle-shadow: 0.5px 0.5px 2px 1px rgba(0, 0, 0, 0.32);
  --slider-handle-shadow-active: 0.5px 0.5px 2px 1px rgba(0, 0, 0, 0.42);
  --slider-handle-ring-width: 3px;
  --slider-handle-ring-color: theme('colors.primary.DEFAULT/.5');

  --slider-tooltip-font-size: 0.875rem;
  --slider-tooltip-line-height: 1.25rem;
  --slider-tooltip-font-weight: 600;
  --slider-tooltip-min-width: 20px;
  --slider-tooltip-bg: theme('colors.primary.dark');
  --slider-tooltip-bg-disabled: theme('colors.gray.light');
  --slider-tooltip-color: theme('colors.white');
  --slider-tooltip-radius: 5px;
  --slider-tooltip-py: 2px;
  --slider-tooltip-px: 6px;
  --slider-tooltip-arrow-size: 5px;
  --slider-tooltip-distance: 3px;

  .slider {
    cursor: pointer;
  }

  .slider-handle {
    cursor: pointer !important;
  }

  &:hover .slider-tooltip {
    display: block !important;
  }
}
</style>
