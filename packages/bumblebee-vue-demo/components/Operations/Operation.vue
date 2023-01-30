<template>
  <form
    ref="operationElement"
    class="flex flex-wrap px-2 pt-5 gap-y-5"
    @submit.prevent="submit"
  >
    <AppAutocomplete
      v-if="options?.usesInputCols"
      v-model="columns"
      multiple
      label="Columns"
      name="Columns"
      class="w-full"
      :options="Object.keys(dataframeObject?.profile?.columns || {})"
    />
    <template v-if="operation?.fields?.length">
      <template v-for="field in operation.fields">
        <div
          v-if="field.type === 'group' && 'fields' in field"
          :key="`${field.name}-group`"
          class="w-full flex flex-wrap gap-y-5"
        >
          <div v-if="field.label" class="w-full text-text mb-[-12px]">
            {{ field.label }}
          </div>
          <div
            v-for="(group, groupIndex) in operationValues[field.name] || []"
            :key="`${field.name}-group-${groupIndex}`"
            class="w-full flex flex-wrap gap-y-5"
          >
            <div
              v-if="groupIndex > 0"
              class="font-bold mx-auto w-full text-center text-text-light text-sm my-[-12px]"
            >
              or
            </div>
            <AppOperationField
              v-for="subfield in field.fields"
              :key="`${subfield.name}-group-${groupIndex}`"
              :field="subfield"
              :parent-field="field.name"
              :subfield-index="groupIndex"
            />
            <div class="flex flex-col w-[6%] mt-[-2px] h-[42px]">
              <AppButton
                :key="`${field.name}-delete-${groupIndex}`"
                type="button"
                class="btn-layout-invisible btn-icon btn-size-small btn-color-text"
                :icon="mdiClose"
                @click="deleteFromGroup(field.name, groupIndex)"
              />
              <AppButton
                :key="`${field.name}-add-${groupIndex}`"
                type="button"
                class="btn-layout-invisible btn-icon btn-size-small btn-color-primary"
                :icon="mdiPlus"
                @click="addToGroup(field.name, groupIndex)"
              />
            </div>
          </div>
          <AppButton
            :key="`${field.name}-add-${field.fields.length}`"
            class="mx-auto mt-[-12px] btn-layout-text btn-color-primary-light"
            type="button"
            @click="addToGroup(field.name)"
          >
            {{ field.addLabel || 'Add' }}
          </AppButton>
        </div>
        <AppOperationField v-else :key="field.name" :field="field" />
      </template>
    </template>
    <div class="w-full flex justify-end gap-2">
      <AppButton
        class="btn-layout-invisible"
        :disabled="Boolean(status)"
        :loading="status === 'cancelling'"
        type="button"
        @click="cancel"
      >
        Cancel
      </AppButton>
      <AppButton
        :disabled="Boolean(status)"
        :loading="status === 'submitting'"
        type="submit"
      >
        Accept
      </AppButton>
    </div>
  </form>
</template>
<script setup lang="ts">
import { mdiPlus, mdiClose } from '@mdi/js';
import { ComputedRef, Ref } from 'vue';

import { DataframeObject } from '@/types/dataframe';
import {
  isOperation,
  OperationActions,
  Payload,
  State,
  TableSelection
} from '@/types/operations';

const state = inject('state') as Ref<State>;
const operation = computed(() =>
  isOperation(state.value) ? state.value : null
);
const operationValues = inject('operation-values') as Ref<Payload>;
const { submitOperation, cancelOperation } = inject(
  'operation-actions'
) as OperationActions;

const operationElement = ref<HTMLElement | null>(null);

const status = ref<'' | 'submitting' | 'cancelling'>('');

const submit = async () => {
  status.value = 'submitting';
  const result = await submitOperation();
  status.value = '';
  return result;
};

const cancel = async () => {
  status.value = 'cancelling';
  const result = await cancelOperation();
  status.value = '';
  return result;
};

const dataframeObject = inject(
  'dataframe-object'
) as ComputedRef<DataframeObject>;
const selection = inject('selection') as Ref<TableSelection>;

const columns = computed({
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

const options = computed(() => {
  console.log('Getting options from operation', operation.value);
  return Object.assign(
    {},
    operationValues.value.options || {},
    operation.value?.defaultOptions || {},
    { targetType: 'dataframe' }
  );
});

onMounted(() => {
  if (!operationElement.value) {
    return;
  }

  const input = operationElement.value.querySelector(
    'input, textarea'
  ) as HTMLInputElement;

  if (input) {
    input.focus();
  }
});

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
</script>
