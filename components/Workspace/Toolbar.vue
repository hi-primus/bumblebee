<template>
  <div class="workspace-toolbar bg-white">
    <Popup
      v-if="showCommands"
      class="popup-narrow w-[calc(10vw+380px)]"
      :closable="false"
      @close="showCommands = false"
    >
      <AppInput
        ref="searchOperationElement"
        v-model="searchOperation"
        class="mb-2"
        placeholder="Select a command"
        autocomplete="off"
        @keydown="handleKeyDownSearch"
      />
      <ul
        ref="operationElements"
        class="operation-items h-[50vh] overflow-auto flex flex-col gap-2"
      >
        <li
          v-for="operation in recentOperations"
          :key="operation.key + 'recent' + searchOperation"
          v-tooltip="
            typeof operation.disabled === 'string' ? operation.disabled : null
          "
          class="operation-item flex items-center justify-between gap-2 px-4 py-2 select-none rounded"
          :class="{
            'opacity-50': operation.disabled,
            'cursor-pointer hover:bg-primary-highlight focus:bg-primary-highlight focus:outline-none':
              !operation.disabled
          }"
          :tabindex="operation.disabled ? -1 : 0"
          :data-operation-key="operation.key"
          role="option"
          @keydown.prevent="
            $event =>
              operation.disabled ? null : handleKeyDownOperation($event)
          "
          @click="
            () => {
              if (operation.disabled) {
                return;
              }
              selectOperationItem(operation);
              showCommands = false;
            }
          "
        >
          <span
            class="text-neutral-light"
            v-html="highligthMatch(operation.name, searchOperation)"
          ></span>
          <ShortcutKeys
            v-if="operation.shortcut"
            :shortcut="operation.shortcut"
          />
        </li>
        <li
          v-if="recentOperations?.length && notRecentOperations?.length"
          key="divider"
          class="divider min-h-[0.8124px] my-[-4px] ml-[1rem] bg-line w-[calc(100%-2rem)]"
        ></li>
        <li
          v-for="operation in notRecentOperations"
          :key="operation.key + 'notRecent' + searchOperation"
          v-tooltip="
            typeof operation.disabled === 'string' ? operation.disabled : null
          "
          class="operation-item flex items-center justify-between gap-2 px-4 py-2 select-none rounded"
          :class="{
            'opacity-50': operation.disabled,
            'cursor-pointer hover:bg-primary-highlight focus:bg-primary-highlight focus:outline-none':
              !operation.disabled
          }"
          :tabindex="operation.disabled ? -1 : 0"
          :data-operation-key="operation.key"
          role="option"
          @keydown.prevent="
            $event =>
              operation.disabled ? null : handleKeyDownOperation($event)
          "
          @click="
            () => {
              if (operation.disabled) {
                return;
              }
              selectOperationItem(operation);
              showCommands = false;
            }
          "
        >
          <span
            class="text-neutral-light"
            v-html="highligthMatch(operation.name, searchOperation)"
          ></span>
          <ShortcutKeys
            v-if="operation.shortcut"
            :shortcut="operation.shortcut"
          />
        </li>
        <li
          v-if="!notRecentOperations?.length && !recentOperations?.length"
          class="text-neutral-lighter w-full px-2 py-6 text-center pointer-events-none flex-1"
        >
          No commands found
        </li>
      </ul>
    </Popup>
    <Popup
      v-if="showSettings"
      title="Settings"
      class="w-[calc(10vw+380px)]"
      @close="showSettings = false"
    >
      <form ref="settingsFormElement" autocomplete="none">
        <AppInput
          id="openAiApiKey"
          v-model="localAppSettings.openAiApiKey"
          name="openAiApiKey"
          class="mb-2"
          label="OpenAI API Key"
          type="password"
          autocomplete="current-password"
          @update:model-value="updateLocalAppSettings"
        />
      </form>
      <div
        class="w-full p-2 flex gap-2 justify-center items-center font-bold text-md"
      >
        <template v-if="updatedSettings">
          <span class="text-success-dark">Settings updated</span>
          <Icon class="w-5 h-5 text-success-dark" :path="mdiCheck" />
        </template>
        <template v-else>
          <span class="text-neutral-lighter">Updating settings</span>
          <Icon
            class="w-5 h-5 text-neutral-lighter animate-spin"
            :path="mdiLoading"
          />
        </template>
      </div>
    </Popup>
    <section class="w-full flex items-center px-5 h-full">
      <AppButton
        v-tooltip="'Select a command'"
        class="ml-auto icon-button layout-invisible size-small color-neutral-light"
        @click="showCommands = true"
      >
        <Icon :path="mdiMagnify" />
      </AppButton>
      <span
        v-tooltip="
          sidebarDisabled
            ? 'No operations available'
            : isInOperation
            ? showSidebar
              ? 'Hide operation'
              : 'Show operation'
            : showSidebar
            ? 'Close sidebar'
            : 'Open sidebar'
        "
      >
        <AppButton
          class="icon-button layout-invisible size-small"
          :class="[
            isInOperation ? 'color-primary-light' : 'color-neutral-light'
          ]"
          :disabled="sidebarDisabled"
          @click="showSidebar = !showSidebar"
        >
          <Icon :path="mdiCodeTags" />
        </AppButton>
      </span>
      <AppMenu
        :items="[
          {
            text: 'Settings',
            action: () => {
              showSettings = !showSettings;
            }
          }
        ]"
      >
        <AppButton
          class="icon-button layout-invisible size-small color-neutral-light"
        >
          <Icon :path="mdiDotsVertical" />
        </AppButton>
      </AppMenu>
    </section>
  </div>
</template>

<script setup lang="ts">
import {
  mdiCheck,
  mdiCodeTags,
  mdiDotsVertical,
  mdiLoading,
  mdiMagnify
} from '@mdi/js';
import { Ref } from 'vue';

import AppInput from '@/components/App/Input.vue';
import { AppSettings } from '@/types/app';
import {
  ContextCallbackOr,
  isOperation,
  Operation,
  OperationActions,
  OperationItem,
  State
} from '@/types/operations';
import { focusNext, focusPrevious } from '@/utils';
import { operations } from '@/utils/operations';
import { debounce } from '@/utils/time';

const { addToast } = useToasts();

const showCommands = ref(false);
const showSettings = ref(false);

const appSettings = inject('app-settings') as Ref<AppSettings>;
const localAppSettings = ref<AppSettings>({ ...appSettings.value });
const updatedSettings = ref(true);

const settingsFormElement = ref<HTMLElement | null>(null);

const state = inject('state') as Ref<State>;

const selection = inject('selection') as Ref<TableSelection>;

const { selectOperation } = inject('operation-actions') as OperationActions;

const showSidebar = inject('show-sidebar') as Ref<boolean>;

const operationCells = inject<Ref<OperationItem[]>>('operations', ref([]));

const lastKeys = ref<string[]>([]);

const searchOperation = ref<string>('');

const operationElements = ref<HTMLElement | null>(null);
const searchOperationElement = ref<typeof AppInput | null>(null);

const resolveContext = <T>(value: ContextCallbackOr<T>) => {
  if (value instanceof Function) {
    return value({
      selection: selection.value,
      appSettings: appSettings.value
    });
  }

  return value;
};

const highligthMatch = (text: string, match: string) => {
  const regex = new RegExp(match, 'gi');
  return text.replace(
    regex,
    match => `<span class="bg-warning-highlight">${match}</span>`
  );
};

type OperationWithKey = Operation & { key: string };

const operationsList = computed<OperationWithKey[]>(() => {
  return Object.entries(operations)
    .map(([key, operation]) => ({
      key,
      ...operation,
      disabled: resolveContext(operation.disabled),
      hidden: resolveContext(operation.hidden)
    }))
    .filter(operation => !operation.hidden);
});

const filteredOperations = computed(() => {
  const search = searchOperation.value?.toLowerCase();
  return operationsList.value.map(operation => {
    let matches = 1;

    if (search) {
      matches = 0;

      matches = operation.words.filter(word =>
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
    operation: OperationWithKey;
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

const isInOperation = computed(() => {
  return isOperation(state.value);
});

const sidebarDisabled = computed(() => {
  return !operationCells.value?.length && !isInOperation.value;
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
  async () => {
    if (showCommands.value) {
      searchOperation.value = '';
      await new Promise(resolve => setTimeout(resolve, 0));
      focusInput(searchOperationElement.value);
    }
  }
);

watch(
  () => showSettings.value,
  async () => {
    if (showSettings.value) {
      await new Promise(resolve => setTimeout(resolve, 0));
      if (settingsFormElement.value) {
        const inputs = settingsFormElement.value.getElementsByTagName(
          'input'
        ) as HTMLCollectionOf<HTMLInputElement>;
        if (inputs.length) {
          inputs[0].focus();
        }
      }
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
        const operation = {
          ...operations[operationKey],
          key: operationKey
        };
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
    const operation = {
      ...operations[operationKey],
      key: operationKey
    };
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

const selectOperationItem = (
  operation: OperationWithKey | null = null
): void => {
  if (operation) {
    if (recentOperationKeys.value.length >= 5) {
      recentOperationKeys.value.shift();
    }
    recentOperationKeys.value.push(operation.key);
  }
  selectOperation(operation);
};

const onKeyDown = (event: KeyboardEvent): void => {
  const key = event.key.toLowerCase();
  if (key === 'k' && event.ctrlKey) {
    showCommands.value = !showCommands.value;
    event.preventDefault();
  } else if (key === 'escape') {
    if (showCommands.value) {
      showCommands.value = false;
      event.stopImmediatePropagation();
    }
  }
};

const onKeyUp = (event: KeyboardEvent): void => {
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

  if (['shift', 'control', 'alt', 'escape'].includes(key)) {
    lastKeys.value = [];
    return;
  }

  lastKeys.value.push(event.key.toLowerCase());

  const shortcut = lastKeys.value.join('');

  const operation = operationsList.value.find(
    operation => operation.shortcut && shortcut.endsWith(operation.shortcut)
  );

  if (operation) {
    lastKeys.value = [];
    selectOperationItem(operation);
  }
};

const updateLocalAppSettings = () => {
  updatedSettings.value = false;
  updateAppSettings();
};

const updateAppSettings = debounce(() => {
  updatedSettings.value = true;
  appSettings.value = { ...localAppSettings.value };
  addToast({
    title: 'Settings updated',
    type: 'success'
  });
}, 1000);

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
