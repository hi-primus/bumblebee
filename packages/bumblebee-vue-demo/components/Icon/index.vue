<template>
  <svg class="w-5 h-5 text-text" viewBox="0 0 24 24" style="fill: currentColor;">
    <path :d="path" />
  </svg>
</template>

<script setup lang="ts">
  const { path } = defineProps({
    path: {
      type: String,
      required: true,
    }
  });
</script>