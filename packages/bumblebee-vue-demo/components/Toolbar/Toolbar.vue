<template>
  <section class="w-full px-5 overflow-hidden h-full">
    <ul class="h-full flex items-center">
      <ToolbarButton
        v-for="(tool, index) in tools"
        :key="tool?.name"
        @click="() => selected = index"
        :active="selected==index"
        :tool="tool"
      />
    </ul>
  </section>
</template>

<script setup lang="ts">
import { PropType, computed, ref } from 'vue';
import { ToolButton } from 'types/workspace';

const props = defineProps({
  tools: {
    type: Array as PropType<ToolButton[]>,
    default: () => []
  }
});

let selected = ref(props.tools.length > 0 ? 0 : null);

</script>