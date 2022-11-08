<template>
  <footer class="workspace-footer bg-white border-line border-solid border-t">
    <div class="flex h-full justify-end items-center gap-8 mx-8 font-mono">
      <span>{{ props.dataTypes }} Data types</span>
      <span>{{ props.rowsLoaded }} of {{ props.rowsTotal }} rows</span>
      <span>{{ props.columns }} columns</span>
    </div>
  </footer>
</template>
<script setup lang="ts">
const props = defineProps({
  columns: {
    type: Number,
    default: 0
  },
  rowsLoaded: {
    type: Number,
    default: 0
  },
  rowsTotal: {
    type: Number,
    default: 0
  },
  dataTypes: {
    type: Number,
    default: 0
  }
});
</script>
