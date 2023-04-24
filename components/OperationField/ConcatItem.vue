<template>
  <div>
    <span class="data-item-title" :title="item.name">
      <ColumnTypeHint :data-type="item.type || 'unknown'" />
      <span class="data-column-name">
        {{ item.name }}
      </span>
    </span>
    <span class="data-item-value" :title="item.value">
      {{ item.value }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { PropType } from 'vue';

defineProps({
  item: {
    type: Object as PropType<{ name: string; value: string; type: string }>,
    required: true
  }
});
</script>
