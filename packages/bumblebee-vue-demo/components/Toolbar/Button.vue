<template>
  <button
    class="
      h-12
      w-12
      cursor-pointer
      flex
      flex-col
      justify-center
      items-center
      rounded-md
      text-text
      bg-white
    "
    :class="{ 'bg-primary-50': active }"
  >
    <Icon
      :path="tool?.icon"
      class="h-5 w-5 text-text/75"
    >
    </Icon>
    <div class="font-200 text-xs h-5 leading-none atracking-tighter lign-middle uppercase text-text/75" v-html="tool?.label"></div>
  </button>
</template>

<script setup lang="ts">
import { PropType } from 'vue';
import { ToolData } from './ToolData';

const props = defineProps({
  tool: {
    type: Object as PropType<ToolData>,
    default: {}
  },
  active: {
    type: Boolean,
    default: false
  }
});

</script>