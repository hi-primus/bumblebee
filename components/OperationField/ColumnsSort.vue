<template>
  <draggable
    v-model="myValue"
    tag="ul"
    class="columns-sort-component w-full flex flex-col gap-2 items-stretch"
  >
    <template #item="{ element }">
      <li
        class="flex items-center gap-2 cursor-move bg-primary-highlight rounded pl-6 pr-2 py-1"
      >
        <ColumnTypeHint
          class="text-neutral-alpha text-left w-[2em]"
          :data-type="typesMap[element] || 'unknown'"
        />
        <span class="font-mono text-neutral">
          {{ element }}
        </span>
      </li>
    </template>
  </draggable>
</template>

<script setup lang="ts">
import { PropType } from 'vue';

import { DataframeObject } from '@/types/dataframe';
import { OperationPayload, PayloadWithOptions } from '@/types/operations';
import { getType } from '@/utils/data-types';

const props = defineProps({
  modelValue: {
    type: Object as PropType<string[]>
  }
});

type Emits = {
  (e: 'update:modelValue', value: string[]): void;
};

const emit = defineEmits<Emits>();

const operationValues = inject('operation-values') as Ref<
  OperationPayload<PayloadWithOptions>
>;

const initialValue =
  props.modelValue || operationValues.value?.allColumns || [];

const myValue = ref<string[]>(initialValue);

watch(
  () => props.modelValue,
  value => {
    myValue.value = value || [];
  }
);

watch(
  () => myValue.value,
  value => {
    emit('update:modelValue', value);
  }
);

const dataframeObject = inject(
  'dataframe-object'
) as ComputedRef<DataframeObject>;

const typesMap = computed(() => {
  const typesMap: Record<string, string> = {};
  Object.entries(dataframeObject.value?.profile?.columns || {}).forEach(
    ([key, column]) => {
      typesMap[key] = getType(column);
    }
  );
  return typesMap;
});
</script>

<style lang="scss">
$concat-item-height: 28px;
$highlight-red: theme('colors.danger.highlight');
$concat-col-width: calc(124px + 5vw);
$concat-output-col-width: calc(154px + 6vw);
$concat-output-col-padding: 74px;

.col-header-container {
  .col-header {
    min-width: $concat-col-width;
  }
}

.concat-item {
  @apply px-2 flex flex-wrap items-center justify-start gap-x-2;
  .close-button {
    pointer-events: none;
    opacity: 0;
    display: block;
  }
  &:hover,
  &.ghost {
    .close-button {
      pointer-events: auto;
      opacity: 1;
    }
  }
}

.concat-items-component {
  --concat-item-height: 28px;
  @apply bg-primary-highlight;
  &.show-values {
    --concat-item-height: 50px;
    .data-item-value {
      display: block !important;
    }
    .data-item-hint {
      left: unset !important;
      top: -2px !important;
    }
  }
}

.concat-items-component {
  padding-bottom: 0 !important;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 270px);
  height: calc(100vh - 300px);
  justify-content: flex-start;

  .concat-deleted-title {
    z-index: 2;
    background: theme('colors.primary.highlight');
    align-self: flex-start;
    position: relative;
    left: 0;
    padding-right: 10px;
    padding-bottom: 4px;
    line-height: 1em;
    border-bottom-right-radius: 12px;
    pointer-events: none;
    top: 2px;
    min-height: 28px;
  }
  .concat-items {
    overflow-y: auto;
    min-height: 112px;
    margin-bottom: -1px;
    flex-shrink: 3;
    flex-grow: 3;
  }
  .deleted-items {
    flex-shrink: 3;
    flex-grow: 2;
    min-height: 112px;
    background: theme('colors.primary.highlight');
    border-top: solid 1px rgba(0, 0, 0, 0.09);
    margin-top: -27px;
    padding-top: 32px;
    overflow-y: auto;
    position: relative;
  }
  &::after {
    content: ' ';
    background: theme('colors.primary.highlight');
    z-index: 2;
    width: 100%;
    min-height: 0px;
    height: 100%;
    flex-shrink: 1000000000;
  }
}

.concat-items-set {
  display: flex;
  min-width: 98px;
  min-height: $concat-item-height;
  @apply font-mono-table;

  &.concat-items {
    .concat-item {
      background: white;
    }
    .items-cols {
      min-height: inherit;
      display: flex;
      flex-shrink: 1;
      align-items: flex-start;
    }
  }
  .deleted-items-empty {
    position: absolute;
    pointer-events: none;
    top: 28px;
  }

  .items-col {
    display: flex;
    flex-direction: column;
    position: relative;
    min-height: $concat-item-height;
    min-width: $concat-col-width;
    .concat-item {
      cursor: move;
      .data-item-title {
        // @include name-center;
        max-width: calc(#{$concat-col-width} - 36px);
      }
    }
  }
  .output-col {
    padding-left: $concat-output-col-padding;
    min-width: calc(
      #{$concat-output-col-width} + #{$concat-output-col-padding}
    );
    .concat-item {
      @apply pl-4;
      cursor: pointer !important;
      .data-item-title {
        position: relative;
        // &::after {
        //   @include mdi-icon;
        //   content: '\F05E7' !important;
        //   top: -1px;
        //   position: absolute;
        //   right: -16px;
        //   pointer-events: none !important;
        // }
      }

      &:last-child {
        position: relative;
        &::after {
          pointer-events: none;
          content: '';
          position: absolute;
          width: calc(100% + 2px);
          height: calc(100% + 2px);
          top: calc(100% + 7px);
          left: -1px;
          border-radius: 6px;
          background: rgba(white, 0.5);
        }
      }
    }
  }
  .items-item {
    height: var(--concat-item-height);
    margin-bottom: 6px;
  }
  .items-fields {
    input {
      position: relative;
      top: 1px;
    }
  }

  .concat-item {
    transition: background-color ease-in-out 0.1s;
    position: relative;
    font-size: 14px;
    min-width: calc(100% - 6px);
    max-width: calc(100% - 6px);
    min-height: var(--concat-item-height);
    height: var(--concat-item-height);
    line-height: 20px;
    margin-bottom: 6px;
    margin-right: 6px;
    border-radius: 6px;
    border-width: 1px;
    border-style: solid;
    border-color: transparent;

    .data-item-title {
      @apply w-full text-base flex gap-x-2 items-center;

      .data-type {
        user-select: none;
        position: absolute;
        display: block;
        min-width: 32px;
      }
      .data-column-name {
        flex-shrink: 0;
        display: inline-block;
        &:not(.editable-element) {
          max-width: calc(#{$concat-col-width} - 90px);
          width: calc(#{$concat-col-width} - 90px);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }

    .data-item-value,
    .data-item-hint {
      @apply relative max-h-[18px];
      top: -2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: calc(#{$concat-col-width} - 50px);
    }

    .data-item-hint {
      @apply block mt-[-6px];
      pointer-events: none !important;
      user-select: none;
      left: calc(100% + 44px);
      top: -17px;
      /* upper small */
      @apply small-upper;
    }

    .data-item-value {
      // padding-left: 32px;
      // opacity: 0.71;
      display: none;
      &::before {
        max-width: 32px;
        // content: 'VALUE: ';
        font-size: 0.75em;
        font-weight: 700;
        text-transform: uppercase;
        @apply font-mono;
        opacity: 0.71;
      }
    }
    .close-button {
      position: absolute;
      right: 8px;
      top: calc(50% - 8px);
      padding-top: 0.75px !important;
      color: rgba(0, 0, 0, 0.54);
    }
    &.ghost {
      background: white;
      // border-color: $data-grey;
    }
  }
  .items-item {
    position: relative;
    .items-slot {
      height: 100%;
      width: 100%;
      & > .concat-item {
        position: absolute;
      }
    }
    .search-button {
      position: absolute;
      display: none;
      opacity: 0;
      left: 0;
      top: 0;
      width: calc(100% - 6px);
      height: 100%;
      max-height: var(--concat-item-height);
      cursor: pointer;
      z-index: 5;
      &::after {
        content: none;
      }
    }
    &.empty-slot {
      .search-button {
        display: inline-flex;
      }
      &:hover {
        .search-button {
          opacity: 1;
        }
      }
      // &:hover::after {
      //   color: rgba(0, 0, 0, 0);
      // }
      &::after {
        content: 'No column';
        font-weight: 400;
        position: absolute;
        opacity: 1;
        border: rgba(0, 0, 0, 0.2) dashed 1px;
        color: rgba(0, 0, 0, 0.4);
        background: rgba(white, 0.5);
        transition: color ease-in-out 0.3s;
        @apply font-mono;
        font-size: 16px;
        line-height: calc(var(--concat-item-height) - 2px);
        text-align: center;
        padding-right: 1px;
        width: calc(100% - 6px);
        height: 100%;
        max-height: var(--concat-item-height);
        left: 0px;
        top: 0px;
        border-radius: 6px;
      }
    }
  }
}

.small-upper {
  @apply text-[13px] text-neutral-alpha/60 uppercase font-bold font-sans;
}
</style>
