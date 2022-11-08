<template>
  <Table :header="header" :data="data"> </Table>
</template>

<script setup lang="ts">
import { PropType } from 'vue';

const { chunks } = defineProps({
  chunks: {
    type: Array as PropType<Array<object>>
  },
  header: {
    type: Array
  }
});

const data = computed(() => chunks); // TODO: Chunks to table
</script>
