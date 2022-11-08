<template>
  <button
    class="
      h-[56px]
      px-1
      pt-1
      cursor-pointer
      flex
      flex-col
      items-center
      rounded-md
      text-text
      bg-white
    "
    :class="[{ 'bg-primary-50': active }, tool?.class || '']"
  >
    <Icon
      :path="tool?.icon"
      class="text-text/75"
    >
    </Icon>
    <div class="font-300 text-[11.25px] h-5 leading-[normal] atracking-none text-text/75" v-html="tool?.label"></div>
  </button>
</template>

<script setup lang="ts">
import { PropType } from 'vue';
import { ToolButton } from 'types/workspace';

const props = defineProps({
  tool: {
    type: Object as PropType<ToolButton>,
    default: {}
  },
  active: {
    type: Boolean,
    default: false
  }
});

</script>