<template>
  <span v-if="shortcut" class="whitespace-nowrap">
    <span v-for="(key, index) in shortcut" :key="key">
      <span v-if="index > 0" class="text-text-lighter text-xs px-1">then</span>
      <span
        class="inline-block uppercase border border-1 border-line rounded-md w-[24px] h-[24px] text-center text-text-light text-sm leading-[24px]"
      >
        {{ key }}
      </span>
    </span>
  </span>
</template>

<script setup lang="ts">
import { PropType } from 'vue';

defineProps({
  shortcut: {
    type: Array as PropType<string[] | string>,
    required: true
  }
});
</script>
