<template>
  <aside
    class="
      workspace-aside
      bg-white
      border-line
      border-solid
      border-l
    "
  >
    <div
      class="
        w-full
        h-8
        bg-primary-50
        text-text/90
        flex
        justify-center
        items-center
      "
    >
      <h3>Operations</h3>
    </div>
    <ul class="p-4">
      <OperationsOperation
        v-for="(operation, index) in operations"
        :key="index"
      />
    </ul>
  </aside>
</template>

<script setup lang="ts">
let operations: Array<Object> = [{}, {}, {}, {}]
</script>
