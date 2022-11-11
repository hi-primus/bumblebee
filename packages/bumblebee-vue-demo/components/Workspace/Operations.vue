<template>
  <aside class="workspace-aside bg-white border-line border-solid border-l">
    <div
      class="w-full h-8 bg-primary-50 text-text/90 flex justify-center items-center"
    >
      <h3>Operations</h3>
    </div>
    <ul class="p-4 flex flex-col gap-2">
      <OperationsOperation
        v-for="(operation, index) in operations"
        :key="index"
        :index="index"
      />
    </ul>
  </aside>
</template>

<script setup lang="ts">
let operations: Object[] = [];
</script>
