<template>
  <div class="workspace-toolbar bg-white">
    <AppPopup
      v-if="showCommands"
      class="popup-narrow"
      :closable="false"
      @close="showCommands = false"
    >
      <AppInput
        ref="searchOperationElement"
        v-model="searchOperation"
        class="mb-2"
        placeholder="Select a command"
        @keydown="handleKeyDownSearch"
      />
      <ul
        ref="operationElements"
        class="operation-items max-h-[50vh] overflow-auto flex flex-col gap-2"
      >
        <li
          v-for="operation in recentOperations"
          :key="operation.key + 'recent' + searchOperation"
          class="operation-item flex items-center justify-between gap-2 px-4 py-2 cursor-pointer pointer-events-auto rounded focus:bg-primary-highlight hover:bg-primary-highlight focus:outline-none"
          :data-operation-key="operation.key"
          tabindex="0"
          role="option"
          @keydown.prevent="handleKeyDownOperation"
          @click="
            () => {
              selectOperationItem(operation);
              showCommands = false;
            }
          "
        >
          <span class="text-text-light" v-html='highligthMatch(operation.name , searchOperation)'></span>
          <span class="text-text-lighter">{{ operation.shortcut }}</span>
        </li>
        <li
          v-if="recentOperations?.length && notRecentOperations?.length"
          key="divider"
          class="divider min-h-[0.8124px] my-[-4px] ml-[1rem] bg-line w-[calc(100%-2rem)]"
        ></li>
        <li
          v-for="operation in notRecentOperations"
          :key="operation.key + 'notRecent' + searchOperation"
          class="operation-item flex items-center justify-between gap-2 px-4 py-2 cursor-pointer pointer-events-auto rounded focus:bg-primary-highlight hover:bg-primary-highlight focus:outline-none"
          tabindex="0"
          :data-operation-key="operation.key"
          role="option"
          @keydown="handleKeyDownOperation"
          @click="
            () => {
              selectOperationItem(operation);
              showCommands = false;
            }
          "
        >
          <span class="text-text-light" v-html='highligthMatch(operation.name , searchOperation)'></span>
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

import AppInput from '@/components/App/Input.vue';
import { Operation, OperationActions, State } from '@/types/operations';
import { focusNext, focusPrevious } from '@/utils';
import { operations } from '@/utils/operations';

const showCommands = ref(false);

const state = inject('state') as Ref<State>;

const { selectOperation } = inject('operation-actions') as OperationActions;

const showSidebar = inject('show-sidebar') as Ref<boolean>;

const lastKeys = ref<string[]>([]);

const searchOperation = ref<string>('');

const operationElements = ref<HTMLElement | null>(null);
const searchOperationElement = ref<typeof AppInput | null>(null);


const highligthMatch = (text: string, match: string) => {
  const regex = new RegExp(match, 'gi');
  return text.replace(regex, match => `<span class="bg-warn-highlight">${match}</span>`);
};


const filteredOperations = computed(() => {
  const search = searchOperation.value?.toLowerCase();
  return operations.map(operation => {
    let matches = 1;

    if (search) {
      matches = 0;
      const words = `${operation.name} ${operation.alias || ''}`.split(' ');

      matches = words.filter(word =>
        word.toLowerCase().startsWith(search)
      ).length;

      if (operation.shortcut?.toLowerCase().startsWith(search)) {
        matches++;
      }
    }

    const recent = recentOperationKeys.value.findIndex(
      recentKey => recentKey === operation.key
    );

    return {
      operation,
      matches,
      recent
    };
  }) as {
    operation: Operation;
    matches: number;
    recent: number;
  }[];
});

const recentOperationKeys = ref<string[]>([]);

const recentOperations = computed(() => {
  return filteredOperations.value
    .filter(operation => operation.recent > -1)
    .filter(operation => operation.matches > 0)
    .sort((a, b) => b.recent - a.recent)
    .sort((a, b) => b.matches - a.matches)
    .map(operation => operation.operation);
});

const notRecentOperations = computed(() => {
  return filteredOperations.value
    .filter(operation => operation.recent === -1)
    .filter(operation => operation.matches > 0)
    .sort((a, b) => b.matches - a.matches)
    .map(operation => operation.operation);
});

const focusInput = (input: typeof AppInput | null): HTMLElement | null => {
  if (input && input.$el) {
    const inputs = (input.$el as HTMLElement).getElementsByTagName('input');
    if (inputs.length) {
      inputs[0].focus();
      return inputs[0];
    }
  }
  return null;
};

watch(
  () => showCommands.value,
  () => {
    if (showCommands.value) {
      searchOperation.value = '';
      setTimeout(() => {
        focusInput(searchOperationElement.value);
      }, 0);
    }
  }
);

const handleKeyDownSearch = (event: KeyboardEvent) => {
  const key = event.key.toLowerCase();
  if (['arrowdown', 'enter'].includes(key)) {
    let el = operationElements.value;

    el = (el as HTMLElement).querySelector(
      '.operation-item:not([disabled])'
    ) as HTMLElement;

    if (el) {
      if (key === 'enter') {
        const operationKey = (el as HTMLElement).dataset.operationKey as string;
        const operation = operations.find(operation => {
          return operation.key === operationKey;
        });
        if (operation) {
          selectOperationItem(operation);
          showCommands.value = false;
          event.preventDefault();
        }
      } else if (key === 'arrowdown') {
        (el as HTMLElement).focus();
        event.preventDefault();
      }
    }
  }
};

const handleKeyDownOperation = (event: KeyboardEvent): void => {
  const targetElement = event.target as HTMLElement;
  const operationKey = targetElement.dataset.operationKey as string;
  const key = event.key.toLowerCase();

  if (key === 'enter') {
    const operation = operations.find(operation => {
      return operation.key === operationKey;
    });
    if (operation) {
      selectOperationItem(operation);
      showCommands.value = false;
      event.preventDefault();
    }
  } else if (key === 'arrowdown') {
    if (focusNext(targetElement)) {
      event.preventDefault();
    }
  } else if (key === 'arrowup') {
    if (!focusPrevious(targetElement)) {
      if (focusInput(searchOperationElement.value)) {
        event.preventDefault();
      }
    } else {
      event.preventDefault();
    }
  }
};

const selectOperationItem = (operation: Operation | null = null): void => {
  if (operation) {
    if (recentOperationKeys.value.length >= 5) {
      recentOperationKeys.value.shift();
    }
    recentOperationKeys.value.push(operation.key);
  }
  selectOperation(operation);
};

const onKeyDown = (event: KeyboardEvent): void => {
  if (event.key.toLowerCase() === 'k' && event.ctrlKey) {
    showCommands.value = !showCommands.value;
    event.preventDefault();
  }
};

const onKeyUp = (event: KeyboardEvent): void => {
  if (event.key.toLowerCase() === 'escape') {
    if (showCommands.value) {
      showCommands.value = false;
    } else if (state.value !== 'operations') {
      selectOperationItem();
    } else if (showSidebar.value) {
      showSidebar.value = false;
    }
    return;
  }

  if (
    event.target &&
    ((event.target as HTMLElement)?.tagName.toLowerCase() === 'input' ||
      (event.target as HTMLElement)?.tagName.toLowerCase() === 'textarea' ||
      (event.target as HTMLElement)?.hasAttribute('contenteditable') ||
      (event.target as HTMLElement)?.classList.contains('pseudo-input'))
  ) {
    return;
  }

  if (lastKeys.value.length === 5) {
    lastKeys.value.shift();
  }

  const key = event.key.toLowerCase();

  if (['shift', 'control', 'alt'].includes(key)) {
    lastKeys.value = [];
    return;
  }

  lastKeys.value.push(event.key.toLowerCase());

  const shortcut = lastKeys.value.join('');

  const operation = operations.find(
    operation => operation.shortcut && shortcut.endsWith(operation.shortcut)
  );

  if (operation) {
    lastKeys.value = [];
    selectOperationItem(operation);
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

<style lang="scss">
.operation-items:not(:focus-within):not(:hover) .operation-item:first-child {
  @apply bg-primary-highlight;
}
</style>
