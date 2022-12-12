<template>
  <div class="workspace-toolbar bg-white min-h-[64px]">
    <section class="w-full px-5 overflow-hidden h-full">
      <ul class="h-full flex items-center">
        <ToolbarButton
          v-for="(tool, index) in toolbarButtons"
          :key="tool?.name"
          :active="selected == index"
          :tool="tool"
          @click="
            () =>
              tool.operation
                ? selectOperation(tool.operation, index)
                : (state = null)
          "
        />
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { Ref } from 'vue';

import { toolbarButtons } from '@/utils/toolbar-buttons';
import { Operation, State } from '@/types/operations';

const state = inject('state') as Ref<State>;

const selected = ref(toolbarButtons.length > 0 ? 0 : null);

const selectOperation = (operation: Operation, index: number) => {
  state.value = operation;
  selected.value = index;
};
</script>
