<template>
  <table class="w-full">
    <!-- <thead>
      <tr>
        <th>Name</th>
        <th>Value</th>
      </tr>
    </thead> -->
    <tbody>
      <tr v-for="(row, rowIndex) in data" :key="rowIndex">
        <td v-for="(value, index) in row" :key="`${rowIndex} ${index}`">
          {{ value }}
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
defineProps<{
  data: (number | string)[][];
}>();
</script>

<style scoped lang="scss">
table {
  @apply text-sm text-neutral;
  td {
    @apply h-[2em];
    &:first-child {
      @apply w-full;
    }
    &:not(:first-child) {
      @apply text-right pl-3;
    }
    &:nth-child(3) {
      @apply text-neutral-lighter;
    }
  }
}
</style>
