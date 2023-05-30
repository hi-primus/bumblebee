<template>
  <AppSelector
    v-if="resolve(field?.options)?.length"
    :key="`selector-${field.name}-${updates}-${fieldClass}`"
    ref="fieldElement"
    v-model="value"
    :options="resolve(field.options)"
    :text-callback="field.textCallback"
    :label="resolve(field.label || field.name)"
    :name="field.name"
    :placeholder="field.placeholder"
    :disabled="resolve(field.disabled)"
    :class="fieldClass"
    :rules="resolveRules"
  >
    <IconButton
      v-if="field.actionButton"
      v-tooltip="field.actionButton.label"
      class="right-icon-button"
      :path="resolve(field.actionButton.icon)"
      @click="field.actionButton.action(operationValues)"
    />
  </AppSelector>
  <AppSuggestionsInput
    v-else-if="
      resolve(field?.type) === 'string' && field.suggestions !== undefined
    "
    :key="`input-suggestions-${field.name}-${updates}-${fieldClass}`"
    ref="fieldElement"
    v-model="value"
    :suggestions="resolve(field.suggestions)"
    suggest-on-empty="column"
    :label="resolve(field.label || field.name)"
    :name="field.name"
    :placeholder="field.placeholder"
    :disabled="resolve(field.disabled)"
    :class="fieldClass"
    :rules="resolveRules"
  >
    <IconButton
      v-if="field.actionButton"
      v-tooltip="field.actionButton.label"
      class="right-icon-button"
      :path="resolve(field.actionButton.icon)"
      @click="field.actionButton.action(operationValues)"
    />
  </AppSuggestionsInput>
  <AppInput
    v-else-if="['string', 'multiline string'].includes(resolve(field?.type))"
    :key="`input-${field.name}-${updates}-${fieldClass}`"
    ref="fieldElement"
    v-model="value"
    :label="resolve(field.label || field.name)"
    :name="field.name"
    :placeholder="field.placeholder"
    :disabled="resolve(field.disabled)"
    :class="fieldClass"
    :rules="resolveRules"
    :type="resolve(field?.type) === 'multiline string' ? 'textarea' : 'text'"
    autocomplete="off"
  >
    <IconButton
      v-if="field.actionButton"
      v-tooltip="field.actionButton.label"
      class="right-icon-button"
      :path="resolve(field.actionButton.icon)"
      @click="field.actionButton.action(operationValues)"
    />
  </AppInput>
  <AppChipsInput
    v-else-if="resolve(field?.type) === 'strings array'"
    :key="`chips-input-${field.name}-${updates}-${fieldClass}`"
    ref="fieldElement"
    v-model="value"
    :label="resolve(field.label || field.name)"
    :name="field.name"
    :placeholder="field.placeholder"
    :disabled="resolve(field.disabled)"
    :class="fieldClass"
    :rules="resolveRules"
    autocomplete="off"
  />
  <AppInput
    v-else-if="resolve(field?.type) === 'number'"
    :key="`number-input-${field.name}-${updates}-${fieldClass}`"
    ref="fieldElement"
    v-model="value"
    :label="resolve(field.label || field.name)"
    :name="field.name"
    :placeholder="field.placeholder"
    :disabled="resolve(field.disabled)"
    :class="fieldClass"
    :rules="resolveRules"
    autocomplete="off"
    type="number"
  />
  <AppCheckbox
    v-else-if="resolve(field?.type) === 'boolean'"
    :key="`check-${field.name}-${updates}-${fieldClass}`"
    ref="fieldElement"
    v-model="value"
    :label="resolve(field.label || field.name)"
    :name="field.name"
    :disabled="resolve(field.disabled)"
    :class="fieldClass"
  />
  <AppFile
    v-else-if="resolve(field?.type) === 'file'"
    :key="`file-${field.name}-${updates}-${fieldClass}`"
    ref="fieldElement"
    v-model="value"
    :label="resolve(field.label || field.name)"
    :name="field.name"
    :disabled="resolve(field.disabled)"
    :class="fieldClass"
  />
  <OperationFieldJoin
    v-else-if="resolve(field?.type) === 'join'"
    :key="`join-${field.name}-${updates}`"
    ref="fieldElement"
    v-model="value"
  />
  <OperationFieldConcat
    v-else-if="resolve(field?.type) === 'concat'"
    :key="`concat-${field.name}-${updates}`"
    ref="fieldElement"
    v-model="value"
    :options="resolve(field.options)"
  />
  <OperationFieldColumnsSort
    v-else-if="resolve(field?.type) === 'columns sort'"
    :key="`columns-sort-${field.name}-${updates}`"
    ref="fieldElement"
    v-model="value"
  />
  <div
    v-else-if="resolve(field?.type) === 'message'"
    :class="fieldClass"
    class="w-full text-neutral-lighter font-bold text-center px-4 text-sm"
  >
    {{ resolve(field.label) }}
  </div>
  <div v-else-if="false" class="w-full text-danger py-2">
    Error creating field of type {{ resolve(field?.type) }}
  </div>
</template>

<script setup lang="ts">
import { Ref } from 'vue';

import {
  Field,
  OperationPayload,
  PayloadCallbackOr,
  PayloadWithOptions,
  TableSelection
} from '@/types/operations';

const props = defineProps<{
  field: Field;
  errorMessage?: string;
  subfieldIndex?: number;
  parentField?: string;
}>();

const fieldElement = ref<{
  validate?: (isExternalCall?: boolean, force?: boolean) => void;
} | null>(null);

const updates = ref(0);

const operationValues = inject('operation-values') as Ref<
  OperationPayload<PayloadWithOptions>
>;

const selection = inject('selection') as Ref<TableSelection>;

const value = computed({
  get: () => {
    let operationValue = operationValues.value;
    if (props.parentField) {
      operationValue = (operationValue || {})[props.parentField];
    }
    if (props.subfieldIndex !== undefined) {
      operationValue = (operationValue || [])[props.subfieldIndex];
    }
    return (operationValue || {})[props.field.name];
  },
  set: (value: unknown) => {
    if (props.subfieldIndex !== undefined && props.parentField) {
      operationValues.value[props.parentField] = [
        ...(operationValues.value[props.parentField] || [])
      ];
      operationValues.value[props.parentField][props.subfieldIndex] = {
        ...(operationValues.value[props.parentField][props.subfieldIndex] ||
          {}),
        [props.field.name]: value
      };
    } else if (props.parentField) {
      operationValues.value[props.parentField] = {
        ...(operationValues.value[props.parentField] || {}),
        [props.field.name]: value
      };
    } else if (props.subfieldIndex !== undefined) {
      operationValues.value[props.field.name] = [
        ...(operationValues.value[props.field.name] || [])
      ];
      operationValues.value[props.field.name][props.subfieldIndex] = value;
    } else {
      operationValues.value[props.field.name] = value;
    }
  }
});

const resolve = <T>(value: PayloadCallbackOr<T>): T => {
  if (value instanceof Function) {
    return value(operationValues.value, props.subfieldIndex);
  }
  return value;
};

const fieldClass = computed(() => {
  const fieldClass: string[] = [resolve(props.field.class || 'w-full')];
  if (resolve(props.field.hidden)) {
    fieldClass.push('hidden');
  }
  if (resolve(props.field.disabled)) {
    fieldClass.push('disabled-field');
  }
  return fieldClass;
});

const resolveRules = computed(() => {
  return [
    ...(resolve(props.field.rules) || []),
    () => props.errorMessage || true
  ];
});

watch(operationValues, () => {
  updates.value++;
});

watch(
  () => props.errorMessage,
  async () => {
    await nextTick();
    validate(false, true);
  }
);

watch(
  value,
  async (value, oldValue) => {
    if ('onChange' in props.field && props.field.onChange) {
      let payload = operationValues.value;
      payload = fillColumns(payload, selection.value);
      const newPayload = await props.field.onChange(payload, value, oldValue);
      if (newPayload && typeof newPayload === 'object') {
        if ('cols' in newPayload && newPayload.cols) {
          if (selection.value) {
            selection.value.columns = newPayload.cols as string[];
          }
          delete (newPayload as Record<string, string>).cols;
        }
        operationValues.value = newPayload;
      }
    }
  },
  { immediate: true }
);

const validate = (isExternalCall = false, force = false) => {
  return fieldElement.value?.validate?.(isExternalCall, force);
};

defineExpose({
  validate
});
</script>
