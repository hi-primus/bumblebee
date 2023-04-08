<template>
  <span
    v-tooltip="typeName || typeHint"
    class="inline text-neutral-alpha/75 max-w-[3.5em] font-mono-table font-bold whitespace-break-spaces"
    :class="{
      'transform scale-x-125 origin-left': (typeHint.length || 3) <= 2,
      'tracking-[-1px] transform scale-x-95 origin-left':
        (typeHint.length || 3) >= 4
    }"
  >
    {{ typeHint }}
  </span>
</template>

<script setup lang="ts">
import { capitalize } from '@/utils';
import { TYPES_HINTS, TYPES_NAMES } from '@/utils/data-types';

const props = defineProps<{
  dataType: string | [string] | [string, string];
}>();

const typeName = computed(() => {
  const dataType = Array.isArray(props.dataType)
    ? props.dataType?.[0]
    : props.dataType;
  const name = TYPES_NAMES[dataType] || capitalize(dataType || 'Unknown');
  // Internal type name
  // if (props.dataType?.[1]) {
  //   return name + ` (${props.dataType?.[1]})`;
  // }
  return name;
});

const typeHint = computed(() => {
  const dataType = Array.isArray(props.dataType)
    ? props.dataType?.[0]
    : props.dataType;
  return TYPES_HINTS[dataType] || dataType?.substring(0, 3) || '';
});
</script>
