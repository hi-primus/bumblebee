<template>
  <section class="bumblebee-tabs w-full px-6 overflow-hidden">
    <ul class="h-12 flex">
      <li
        v-for="tab in tabs"
        :key="tab?.label"
        class="h-12 max-w-[22rem] px-2 flex gap-2 items-center cursor-pointer border-b-2 border-sky-500"
      >
        <div class="ellipsis">
          {{ tab?.label || defaultLabel }}
        </div>
        <div class="tab-icon">(X)</div>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { PropType } from 'vue';

const props = defineProps({
  tabs: {
    type: Array as PropType<Array<TabData>>,
    default: () => []
  }
});

interface TabData {
  label?: string;
}

let defaultLabel = '(new dataset)';

let selected = props.tabs.length > 0 ? 0 : null;

const active = computed(() => {
  return selected ? props.tabs[selected] : null;
});
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
