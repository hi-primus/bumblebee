<template>
  <component
    :is="$attrs.to ? NuxtLink : 'button'"
    v-bind="attrs"
    class="btn"
    :class="[loading || disabled ? 'pointer-events-none' : '']"
    :disabled="loading || disabled"
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
        <Icon :path="mdiLoading" class="fa-spin" />
      </slot>
    </template>
  </component>
</template>

<script lang="ts" setup>
import { mdiLoading } from '@mdi/js';
import { PropType } from 'vue';

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { class: attrClass, style: attrStyle, ...attrs } = useAttrs();
</script>
