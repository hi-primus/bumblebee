<template>
  <button class="focus:outline-1 outline-[currentColor]" type="button">
    <Icon class="h-full w-full" role :path="path" />
  </button>
</template>

<script setup lang="ts">
import { PropType } from 'vue';

defineProps({
  path: {
    type: [String, Boolean] as PropType<string | false>
  }
});
</script>
