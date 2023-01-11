<template>
  <div class="workspace-toolbar bg-white">
    <AppPopup
      v-if="showCommands"
      class="popup-narrow"
      :closable="false"
      @close="showCommands = false"
    >
      <AppInput placeholder="Select a command" />
      <ul class="flex flex-col gap-2 pt-2">
        <li
          v-for="operation in operations"
          :key="operation.name"
          class="flex items-center gap-2 px-4 py-2 cursor-pointer rounded hover:bg-primary-highlight justify-between"
          @click="
            () => {
              selectOperation(operation);
              showCommands = false;
            }
          "
        >
          <span class="text-text-light">{{ operation.name }}</span>
          <span class="text-text-lighter">{{ operation.shortcut }}</span>
        </li>
      </ul>
    </AppPopup>
    <section class="w-full flex items-center px-5 overflow-hidden h-full">
      <AppButton
        class="ml-auto btn-icon btn-layout-invisible btn-size-small btn-color-text-light"
        @click="showCommands = true"
      >
        <Icon :path="mdiMagnify" />
      </AppButton>
      <AppButton
        :tool="{ icon: mdiCodeTags }"
        class="btn-icon btn-layout-invisible btn-size-small btn-color-text-light"
        @click="showSidebar = !showSidebar"
      >
        <Icon :path="mdiCodeTags" />
      </AppButton>
    </section>
  </div>
</template>

<script setup lang="ts">
import { mdiCodeTags, mdiMagnify } from '@mdi/js';
import { Ref } from 'vue';

import { Operation, State } from '@/types/operations';
import { operations } from '@/utils/operations';

const showCommands = ref(false);

const state = inject('state') as Ref<State>;

const showSidebar = inject('show-sidebar') as Ref<boolean>;

const lastKeys = ref<string[]>([]);

const selectOperation = (operation: Operation | null = null) => {
  state.value = operation;
  showSidebar.value = true;
};

const onKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'k' && event.ctrlKey) {
    showCommands.value = !showCommands.value;
    event.preventDefault();
  }
};

const onKeyUp = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    if (showCommands.value) {
      showCommands.value = false;
    } else if (state.value) {
      selectOperation();
    } else if (showSidebar.value) {
      showSidebar.value = false;
    }
    return;
  }

  if (lastKeys.value.length === 5) {
    lastKeys.value.shift();
  }

  lastKeys.value.push(event.key);

  const shortcut = lastKeys.value.join('');

  const operation = Object.values(operations).find(
    operation => operation.shortcut && shortcut.endsWith(operation.shortcut)
  );

  if (operation) {
    lastKeys.value = [];
    selectOperation(operation);
  }
};

onMounted(() => {
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
});

onUnmounted(() => {
  document.removeEventListener('keydown', onKeyDown);
  document.removeEventListener('keyup', onKeyUp);
});
</script>
