<template>
  <aside>
    <ul class="p-4">
      <OperationsOperation
        v-for="(operation, index) in operations"
        :key="index"
        :class="{'mt-2': index !== 0}"
      />
    </ul>
  </aside>
</template>

<script setup lang="ts">
let operations: Array<Object> = [{}, {}, {}, {}]
</script>
