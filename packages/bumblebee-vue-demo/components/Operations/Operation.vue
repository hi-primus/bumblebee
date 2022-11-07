<template>
  <li>
    <div
    class="rounded-md border-text-lighter font-mono px-4 py-2 bg-primary-100"
    >
      <span class="mr-4">{{ index + 1 }}</span>
      <span class="bg-white">
        <span class="font-semibold">Load</span> 'abcdefg.csv' file
      </span>
    </div>
  </li>
</template>
<script setup lang="ts">

const props = defineProps({
  index: {
    type: Number,
    required: true
  }
});

// const editing = computed(() => {
//   return selected ? props.tools[selected.value] : null;
// });
</script>