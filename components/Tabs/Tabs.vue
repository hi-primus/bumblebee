<template>
  <section
    class="bumblebee-tabs min-h-[48px] w-full px-6 overflow-hidden text-neutral-light bg-white text-sm font-sans font-medium"
  >
    <ul class="h-12 absolute flex select-none">
      <li
        v-for="(tab, index) in tabs"
        :key="tab?.label"
        role="button"
        class="h-12 max-w-[22rem] pt-1 px-4 flex gap-2 items-center cursor-pointer border-transparent border-y-2 outline-primary-light outline-offset-[-1px]"
        :class="{ 'border-b-primary text-primary': index === selected }"
        tabindex="0"
        @click="() => emit('update:selected', index)"
        @keydown.enter.space.stop="() => emit('update:selected', index)"
      >
        <EditableElement
          v-if="editing === index"
          :id="`editable-tab-name-${index}`"
          class="ellipsis outline-primary-dark px-1 -mx-1"
          :model-value="tab.label"
          element="div"
          @update:model-value="
            label => {
              emit('rename', index, label);
              editing = -1;
            }
          "
        />
        <div
          v-else
          class="ellipsis"
          :class="{ 'opacity-60': !tab?.label }"
          @click.prevent="
            tab.editable && index === selected && renameTab(index)
          "
          @keydown.r="tab.editable && index === selected && renameTab(index)"
        >
          {{ tab?.label || defaultLabel }}
        </div>
        <IconButton
          v-if="tab.editable && index === selected"
          class="min-w-4 h-4 -ml-[0.33em] -mr-[0.5em] outline-offset-2"
          :path="mdiPencil"
          @click.stop.prevent="
            tab.editable && index === selected && renameTab(index)
          "
        />
        <IconButton
          v-if="closable"
          class="min-w-4 h-4 mr-[-2px] outline-offset-2"
          :path="mdiClose"
          @click.stop.prevent="() => emit('close', index)"
        />
      </li>
      <li
        v-if="addable"
        role="button"
        class="h-full cursor-pointer text-primary outline-primary-light outline-offset-[-1px]"
        tabindex="0"
        @click="() => emit('add')"
        @keydown.enter.space.prevent="() => emit('add')"
      >
        <Icon class="w-12 h-12 p-3" :path="mdiPlus" />
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { mdiClose, mdiPencil, mdiPlus } from '@mdi/js';
import { PropType } from 'vue';

import { Tab } from '@/types/app';

const defaultLabel = 'New dataset';

const props = defineProps({
  tabs: {
    type: Array as PropType<Tab[]>,
    default: () => []
  },
  selected: {
    type: Number,
    default: -1
  },
  addable: {
    type: Boolean,
    default: false
  },
  closable: {
    type: Boolean,
    default: false
  },
  renamable: {
    type: Boolean,
    default: false
  }
});

type Emits = {
  (e: 'update:selected', index: number): void;
  (e: 'rename', index: number, value: string): void;
  (e: 'close', index: number): void;
  (e: 'add'): void;
};

const emit = defineEmits<Emits>();

const editing = ref(-1);

async function renameTab(index: number) {
  if (props.renamable) {
    editing.value = index;
    await nextTick();
    const input = document.getElementById(`editable-tab-name-${index}`);
    if (input) {
      input.focus();
      if (input && window?.getSelection) {
        const range = document.createRange();
        range.selectNodeContents(input);
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(range);
      }
    }
  }
}
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
