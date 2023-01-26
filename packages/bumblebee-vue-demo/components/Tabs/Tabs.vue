<template>
  <section
    class="bumblebee-tabs min-h-[48px] w-full px-6 overflow-hidden text-text-light bg-white text-sm font-sans font-medium"
  >
    <ul class="h-12 absolute flex">
      <li
        v-for="(tab, index) in tabs"
        :key="tab?.label"
        class="h-12 max-w-[22rem] pt-1 px-4 flex gap-2 items-center cursor-pointer border-primary"
        :class="{ 'border-b-2 text-primary': index === selected }"
        @click="() => emit('update:selected', index)"
      >
        <div class="ellipsis">
          {{ tab?.label || defaultLabel }}
        </div>
        <Icon
          class="w-4 h-4 mr-[-2px]"
          :path="mdiClose"
          @click.prevent="() => emit('close', index)"
        />
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { mdiClose } from '@mdi/js';
import { PropType } from 'vue';

import { Tab } from '@/types/workspace';

const defaultLabel = '(new dataset)';

defineProps({
  tabs: {
    type: Array as PropType<Tab[]>,
    default: () => []
  },
  selected: {
    type: Number,
    default: -1
  }
});

type Emits = {
  (e: 'update:selected', index: number): void;
  (e: 'close', index: number): void;
};

const emit = defineEmits<Emits>();
</script>

<style lang="scss">
.tabs {
  width: 100%;
  overflow-x: hidden;
  // @extend .px-2 !optional;
}
.tabs-bar {
  height: 48px;
  display: flex;
}
.tab {
  height: 48px;
  max-width: 360px;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  display: flex;
  gap: 0.5rem;
  justify-content: space-between;
  align-items: center;
}
</style>
