<template>
  <section class="w-full px-6 overflow-hidden h-full">
    <ul class="h-full flex gap-2 items-center">
      <li
        v-for="(tool, index) in tools"
        :key="tool?.name"
      >
        <ToolbarButton
          @click="() => selected = index"
          :active="selected==index"
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
</script>