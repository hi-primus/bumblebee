<template>
  <section class="w-full px-6 overflow-hidden h-full">
    <ul class="h-full flex items-center">
      <li
        v-for="(tool, index) in tools"
        :key="tool?.name"
        :class="{'pl-3': index !== 0}"
      >
        <!-- <button
          class="h-12 w-12 cursor-pointer flex justify-center items-center border rounded-sm bg-white hover:bg-slate-100"
          :class="{'bg-slate-100': tool?.name === active?.name}"
          v-on:click="() => setSelected(index)"
        >
          a
        </button> -->
        <ToolbarButton
          :setSelected="() => setSelected(index)"
          :active="active"
          :tool="tool"
        />
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { PropType, computed, ref } from 'vue';
import { ToolData } from './ToolData';

const props = defineProps({
  tools: {
    type: Array as PropType<Array<ToolData>>,
    default: () => []
  }
});

let selected = ref(props.tools.length > 0 ? 0 : null);

const active = computed(() => {
  return selected ? props.tools[selected.value] : null;
});

const setSelected = (index) => {
  console.log(index);
  selected.value = index;
}
</script>