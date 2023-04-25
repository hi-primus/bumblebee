<template>
  <table
    class="w-full"
    :class="{ 'with-bars': total, 'selectable-data-table': selectable }"
  >
    <tbody>
      <tr
        v-for="(row, rowIndex) in data"
        :key="rowIndex"
        :style="{
          '--bar-width':
            total && displayValueIndex !== undefined
              ? (+row[displayValueIndex] / total) * 100 + '%'
              : ''
        }"
        @click="selectable && $emit('select', row)"
      >
        <td
          v-for="(value, index) in row"
          :key="`${rowIndex} ${index}`"
          :class="valueClass"
        >
          <span>{{ value }}</span>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import { PropType } from 'vue';

defineProps({
  data: {
    type: Array as PropType<(string | number)[][]>,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  displayValueIndex: {
    type: Number,
    default: undefined
  },
  valueClass: {
    type: [Object, String]
  },
  selectable: {
    type: Boolean,
    default: false
  }
});

type Emits = {
  (e: 'select', value: (number | string)[]): void;
};

defineEmits<Emits>();
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

  &.with-bars {
    @apply border-separate border-spacing-y-px -my-px px-1;
    tr {
      --bar-color: theme('colors.primary.DEFAULT');
      background: linear-gradient(
        to right,
        var(--bar-color) var(--bar-width),
        transparent var(--bar-width)
      );
    }
    td {
      @apply overflow-hidden;
      --highlight-opacity: 0.2;
      &:hover {
        --highlight-opacity: 0.33;
      }
      span {
        background: rgba(255, 255, 255, var(--highlight-opacity));
        box-shadow: 0px 0px 6px 12px
          rgba(255, 255, 255, var(--highlight-opacity));
        @apply inline-block;
      }
      &:first-child {
        @apply pl-1;
      }
      &:last-child {
        @apply pr-1;
      }
    }

    &.with-bars.selectable-data-table tr:hover {
      --bar-color: theme('colors.primary.dark');
    }

    &.selectable-data-table tr {
      cursor: crosshair;
    }
  }
}
</style>
