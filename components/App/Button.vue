<template>
  <component
    :is="$attrs.to ? NuxtLink : 'button'"
    :class="[loading || disabled ? 'pointer-events-none' : '', $attrs.class]"
    :style="$attrs.style"
    :disabled="loading || disabled"
    v-bind="$attrs"
    class="btn"
  >
    <template v-if="!loading">
      <slot>
        {{ text }}
      </slot>
      <Icon v-if="icon" :path="icon" />
    </template>
    <template v-else>
      <slot name="loading">
        <template v-if="typeof loading === 'string'">
          {{ loading }}
        </template>
        <Icon :path="mdiLoading" class="animate-spin" />
      </slot>
    </template>
  </component>
</template>

<script lang="ts">
import { mdiLoading } from '@mdi/js';
import { PropType } from 'vue';
export default {
  inheritAttrs: false
};
</script>

<script lang="ts" setup>
const NuxtLink = resolveComponent('NuxtLink');

defineProps({
  text: {
    type: String
  },
  icon: {
    type: String
  },
  disabled: {
    type: Boolean
  },
  loading: {
    type: [Boolean, String] as PropType<boolean | string>,
    default: false
  }
});
</script>
