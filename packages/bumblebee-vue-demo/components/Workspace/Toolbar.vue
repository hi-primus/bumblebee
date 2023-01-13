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
        placeholder="Select a command"
        @keydown="handleKeyDownSearch"
      />
      <ul class="flex flex-col gap-2 pt-2">
        <li
          v-for="operation in recentOperations"
          :key="operation.key"
          ref="operationElements"
          class="flex items-center gap-2 px-4 py-2 cursor-pointer rounded focus:bg-primary-highlight hover:bg-primary-highlight focus:outline-none justify-between"
          :data-operation-key="operation.key"
          tabindex="0"
          role="option"
          @keydown="handleKeyDownOperation"
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
        <li
          v-if="recentOperations?.length && notRecentOperations?.length"
          class="divider h-[1px] my-[-0.25rem] ml-[1rem] bg-line w-[calc(100%-2rem)]"
        ></li>
        <li
          v-for="operation in notRecentOperations"
          :key="operation.key"
          ref="operationElements"
          class="flex items-center gap-2 px-4 py-2 cursor-pointer rounded focus:bg-primary-highlight hover:bg-primary-highlight focus:outline-none justify-between"
          tabindex="0"
          :data-operation-key="operation.key"
          role="option"
          @keydown="handleKeyDownOperation"
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

import AppInput from '@/components/App/Input.vue';
import { Operation, State } from '@/types/operations';
import { operations } from '@/utils/operations';

const showCommands = ref(false);

const state = inject('state') as Ref<State>;

const showSidebar = inject('show-sidebar') as Ref<boolean>;

const lastKeys = ref<string[]>([]);

const searchOperation = ref('');

const operationElements = ref<HTMLElement | HTMLElement[] | null>(null);
const searchOperationElement = ref<typeof AppInput | null>(null);

const filteredOperations = computed(() => {
  return operations.map(operation => {
    let matches = 1;

    if (searchOperation.value) {
      matches = 0;
      const words = `${operation.name} ${operation.alias || ''}`.split(' ');

      matches = words.filter(word =>
        word.toLowerCase().startsWith(searchOperation.value.toLowerCase())
      ).length;

      if (
        operation.shortcut
          ?.toLowerCase()
          .startsWith(searchOperation.value.toLowerCase())
      ) {
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

const focusInput = (input: typeof AppInput | null) => {
  if (input && input.$el) {
    const inputs = (input.$el as HTMLElement).getElementsByTagName('input');
    inputs.length && inputs[0].focus();
  }
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

    if (el && Array.isArray(el)) {
      el = el[0];
    }

    if (el) {
      if (key === 'enter') {
        const operationKey = (el as HTMLElement).dataset.operationKey as string;
        const operation = operations.find(operation => {
          return operation.key === operationKey;
        });
        if (operation) {
          selectOperation(operation);
          showCommands.value = false;
        }
      } else if (key === 'arrowdown') {
        (el as HTMLElement).focus();
      }
    }
  }
};

const handleKeyDownOperation = (event: KeyboardEvent) => {
  const targetElement = event.target as HTMLElement;
  const operationKey = targetElement.dataset.operationKey as string;
  const key = event.key.toLowerCase();

  if (key === 'enter') {
    const operation = operations.find(operation => {
      return operation.key === operationKey;
    });
    if (operation) {
      selectOperation(operation);
      showCommands.value = false;
    }
  } else if (key === 'arrowdown') {
    let el = targetElement.nextElementSibling as HTMLElement;

    if (el) {
      if (el.tabIndex !== 0) {
        el = el.nextElementSibling as HTMLElement;
      }
      el.focus();
    }
  } else if (key === 'arrowup') {
    let el = targetElement.previousElementSibling as HTMLElement;
    if (el) {
      if (el.tabIndex !== 0) {
        el = el.previousElementSibling as HTMLElement;
      }
      el.focus();
    } else {
      focusInput(searchOperationElement.value);
    }
  }
};

const selectOperation = (operation: Operation | null = null) => {
  if (operation) {
    if (recentOperationKeys.value.length >= 5) {
      recentOperationKeys.value.shift();
    }
    recentOperationKeys.value.push(operation.key);
  }
  state.value = operation;
  showSidebar.value = true;
};

const onKeyDown = (event: KeyboardEvent) => {
  if (event.key.toLowerCase() === 'k' && event.ctrlKey) {
    showCommands.value = !showCommands.value;
    event.preventDefault();
  }
};

const onKeyUp = (event: KeyboardEvent) => {
  if (event.key.toLowerCase() === 'escape') {
    if (showCommands.value) {
      showCommands.value = false;
    } else if (state.value) {
      selectOperation();
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
