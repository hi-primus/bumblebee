<template>
  <Table
    :header="header"
    :data="data"
  >
  </Table>
</template>

<script setup lang="ts">
  const { chunks } = defineProps({
    chunks: {
      type: Array // Object
    },
    header: {
      type: Array
    },
  });

  const data = computed(() => chunks); // TODO: Chunks to table
</script>