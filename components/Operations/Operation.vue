<template>
  <component
    :is="options?.usesDialog ? Popup : 'div'"
    :class="[
      options?.usesDialog ? 'operation-dialog' : ''
    ]"
    @close="cancel"
  >
    <form
      ref="operationElement"
      class="operation-form flex flex-wrap pt-5 px-2 gap-y-5"
      @submit.prevent="submit"
    >
      <AppAutocomplete
        v-if="options?.usesInputCols"
        v-model="columns"
        multiple
        :options="allColumns"
        label="Columns"
        name="Columns"
        class="w-full"
      />
      <template v-if="options?.usesOutputCols">
        <AppInput
          v-for="(col, index) in columns"
          :key="`${col}-output`"
          :model-value="operationValues?.outputCols?.[index] || ''"
          class="w-full"
          :label="`Output column ${index + 1} (${col})`"
          :name="col"
          :placeholder="col"
          @update:model-value="updateOutputCol(index, $event)"
        />
      </template>
      <template v-if="operation?.fields?.length">
        <template v-for="field in operation.fields">
          <div
            v-if="field.type === 'group' && 'fields' in field"
            :key="`${field.name}-group`"
            class="w-full flex flex-wrap gap-y-5"
          >
            <div v-if="field.label" class="w-full text-neutral mb-[-12px]">
              {{ field.label }}
            </div>
            <template
              v-for="(_group, groupIndex) in operationValues[field.name] || []"
            >
              <div
                v-if="
                  groupIndex > 0 &&
                  field.groupConnector &&
                  field.groupConnector !== undefined
                "
                :key="`${field.name}-group-${groupIndex}-or`"
                class="font-bold mx-auto w-full text-center text-neutral-light text-sm my-[-12px]"
              >
                {{
                  field.groupConnector === undefined
                    ? 'or'
                    : field.groupConnector
                }}
              </div>
              <div
                v-if="true"
                :key="`${field.name}-group-${groupIndex}`"
                class="w-full flex gap-y-5 items-end"
              >
                <div
                  :data-field-group-name="field.name"
                  :data-subfield-index="groupIndex"
                  class="flex flex-wrap gap-y-5 w-full"
                >
                  <OperationField
                    v-for="subfield in field.fields"
                    :key="`${subfield.name}-group-${groupIndex}`"
                    :field="subfield"
                    :parent-field="field.name"
                    :subfield-index="groupIndex"
                  />
                </div>
                <div class="flex flex-col mt-[-2px] h-[42px]">
                  <AppButton
                    :key="`${field.name}-delete-${groupIndex}`"
                    type="button"
                    class="layout-invisible icon-button size-small color-neutral"
                    :icon="mdiClose"
                    @click="deleteFromGroup(field.name, groupIndex)"
                  />
                  <AppButton
                    :key="`${field.name}-add-${groupIndex}`"
                    type="button"
                    class="layout-invisible icon-button size-small color-primary"
                    :icon="mdiPlus"
                    @click="addToGroup(field.name, groupIndex)"
                  />
                </div>
              </div>
            </template>
            <AppButton
              :key="`${field.name}-add-${field.fields.length}`"
              class="mx-auto mt-[-12px] layout-text color-primary-light"
              type="button"
              @click="addToGroup(field.name)"
            >
              {{ field.addLabel || 'Add' }}
            </AppButton>
          </div>
          <OperationField v-else :key="field.name" :field="field" />
        </template>
      </template>
      <template v-if="saveToNewDataframe !== 'required'">
        <AppCheckbox
          v-model="saveToNewDataframe"
          label="Create new dataframe"
          name="newDataframe"
          class="w-full new-tab-checkbox text-neutral-alpha/60 text-sm font-bold"
        />
      </template>
      <div
        v-if="
          firstValidated &&
          ['error', 'fatal error'].includes(operationStatus.status)
        "
        class="w-full flex justify-end gap-2"
      >
        <Toast
          :title="{
          error: 'Error',
          'fatal error': 'Fatal Error',
        }[operationStatus.status as 'error' | 'fatal error']"
          :message="operationStatus.message"
          type="error"
          :closable="false"
          class="w-full"
        />
      </div>
      <div class="w-full flex justify-end gap-2">
        <AppButton
          class="layout-invisible"
          :disabled="Boolean(status)"
          :loading="status === 'cancelling'"
          type="button"
          @click="cancel"
        >
          Cancel
        </AppButton>
        <AppButton :loading="status === 'submitting'" type="submit">
          Accept
        </AppButton>
      </div>
    </form>
  </component>
</template>
<script setup lang="ts">
import { mdiClose, mdiPlus } from '@mdi/js';
import { ComputedRef, Ref } from 'vue';

import Popup from '@/components/Popup/index.vue';
import { DataframeObject } from '@/types/dataframe';
import {
  isOperation,
  OperationActions,
  OperationOptions,
  OperationStatus,
  PayloadWithOptions,
  State,
  TableSelection
} from '@/types/operations';

const state = inject('state') as Ref<State>;
const operation = computed(() =>
  isOperation(state.value) ? state.value : null
);
const operationValues = inject('operation-values') as Ref<
  Partial<PayloadWithOptions>
>;
const operationStatus = inject('operation-status') as Ref<OperationStatus>;

const { submitOperation, cancelOperation } = inject(
  'operation-actions'
) as OperationActions;

const operationElement = ref<HTMLElement | null>(null);

const status = ref<'' | 'submitting' | 'cancelling'>('');
const firstValidated = ref(false);

const submit = async () => {
  firstValidated.value = true;
  if (submitable.value) {
    status.value = 'submitting';
    const result = await submitOperation();
    status.value = '';
    return result;
  } else if (
    !['error', 'fatal error'].includes(operationStatus.value?.status)
  ) {
    operationStatus.value = {
      status: 'error',
      message: 'Check the fields for errors'
    };
  }
};

const cancel = async () => {
  status.value = 'cancelling';
  const result = await cancelOperation(true);
  status.value = '';
  return result;
};

const dataframeObject = inject(
  'dataframe-object'
) as ComputedRef<DataframeObject>;
const selection = inject('selection') as Ref<TableSelection>;

const allColumns = computed<string[]>(() => {
  return Object.keys(dataframeObject.value?.profile?.columns || {});
});

const columns = computed<string[]>({
  get() {
    return selection.value?.columns || [];
  },
  set(value) {
    selection.value = {
      columns: value,
      ranges: null,
      values: null,
      indices: null
    };
  }
});

const options = computed<OperationOptions>({
  get() {
    return Object.assign(
      { targetType: 'dataframe' } as OperationOptions,
      operation.value?.defaultOptions || {},
      operationValues.value.options || {}
    );
  },
  set(value) {
    if (operationValues.value) {
      operationValues.value.options = value;
    }
  }
});

const saveToNewDataframe = computed<boolean | 'required'>({
  get() {
    return options.value?.saveToNewDataframe || false;
  },
  set(value) {
    options.value = {
      ...options.value,
      saveToNewDataframe: Boolean(value)
    };
  }
});

const submitable = computed<boolean>(() => {
  return operationStatus.value.status === 'ok';
});

onMounted(async () => {
  firstValidated.value = false;

  await new Promise(resolve => setTimeout(resolve, 1));
  if (!operationElement.value) {
    return;
  }
  const input = operationElement.value.querySelector(
    'input, textarea, .input button'
  ) as HTMLInputElement;

  if (input) {
    input.focus();
    return;
  }

  const acceptButton = operationElement.value.querySelector(
    'button[type=submit]'
  ) as HTMLInputElement;

  if (acceptButton) {
    acceptButton.focus();
  }
});

const updateOutputCol = (index: number, value: string) => {
  const operationValue = operationValues.value;
  if (!operationValue.outputCols) {
    operationValue.outputCols = [];
  }
  operationValue.outputCols[index] = value;
  operationValues.value = operationValue;
};

let isAddingOrDeleting = false;

const addToGroup = async (groupName: string, index?: number) => {
  if (isAddingOrDeleting) {
    return;
  }
  isAddingOrDeleting = true;
  await nextTick();
  const defaultValue = operationValues.value[`default-${groupName}`] || {};
  const group = operationValues.value[groupName] || [];
  const newGroup = [...group];
  if (index === undefined) {
    newGroup.push(defaultValue);
  } else {
    newGroup.splice(index + 1, 0, defaultValue);
  }
  operationValues.value = {
    ...operationValues.value,
    [groupName]: newGroup
  };
  isAddingOrDeleting = false;

  await nextTick();

  const newIndex = index === undefined ? group.length : index + 1;
  const prefix = `[data-field-group-name="${groupName}"][data-subfield-index="${newIndex}"]`;
  const input = operationElement.value?.querySelector(
    `${prefix} input, ${prefix} textarea, ${prefix} .input button`
  ) as HTMLInputElement;
  if (input) {
    input.focus();
  }
};

const deleteFromGroup = async (groupName: string, index: number) => {
  if (isAddingOrDeleting) {
    return;
  }
  isAddingOrDeleting = true;
  await nextTick();
  const group = operationValues.value[groupName] || [];
  const newGroup = [...group];
  newGroup.splice(index, 1);
  operationValues.value = {
    ...operationValues.value,
    [groupName]: newGroup
  };
  isAddingOrDeleting = false;
};

let operationInitialized = false;

watch(
  operationValues,
  () => {
    if (!operationInitialized) {
      operationInitialized = true;
    } else {
      firstValidated.value = true;
    }
  },
  { deep: true }
);
</script>

<style lang="scss">
.operation-dialog {
  position: relative;
  .operation-form {
    padding-top: 0;
    margin-top: -0.5rem;
  }
  .new-tab-checkbox {
    pointer-events: none;
    position: absolute;
    bottom: 22px;
    width: 50%;
    .checkbox-input {
      pointer-events: auto;
    }
  }
}
</style>
