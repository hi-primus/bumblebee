<template>
  <svg class="mdi-icon" width="24" height="24" viewBox="0 0 24 24" style="fill: currentColor">
    <path v-if="path" :d="path" />
  </svg>
</template>

<script setup lang="ts">
import { PropType } from 'vue';

const { path } = defineProps({
  path: {
    type: [String, Boolean] as PropType<string | false>,
  }
});
</script>
