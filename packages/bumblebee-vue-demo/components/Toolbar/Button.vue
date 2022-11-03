<template>
  <button
    class="h-12 w-12 cursor-pointer flex justify-center items-center border rounded-sm bg-white hover:bg-slate-100"
    :class="{'bg-slate-100': tool?.name === active?.name}"
    v-on:click="() => setSelected"
  >
    {{ tool?.icon }}
  </button>
</template>

<script setup lang="ts">
import { PropType } from 'vue';
import { ToolData } from './ToolData';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const props = defineProps({
  tool: {
    type: Object as PropType<ToolData>,
    default: {}
  },
  active: {
    type: Object as PropType<ToolData>,
    default: {}
  },
  setSelected: {
    type: Function
  }
});
</script>