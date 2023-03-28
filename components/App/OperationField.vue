<template>
  <AppSelector
    v-if="resolve(field?.options)?.length"
    :key="`selector-${field.name}-${updates}-${fieldClass}`"
    v-model="value"
    :options="resolve(field.options)"
    :text-callback="field.textCallback"
    :label="resolve(field.label || field.name)"
    :name="field.name"
    :placeholder="field.placeholder"
    :disabled="resolve(field.disabled)"
    :class="fieldClass"
  />
  <AppSuggestionsInput
    v-else-if="
      resolve(field?.type) === 'string' && field.suggestions !== undefined
    "
    :key="`input-suggestions-${field.name}-${updates}-${fieldClass}`"
    v-model="value"
    :suggestions="resolve(field.suggestions)"
    suggest-on-empty="column"
    :label="resolve(field.label || field.name)"
    :name="field.name"
    :placeholder="field.placeholder"
    :disabled="resolve(field.disabled)"
    :class="fieldClass"
  />
  <AppInput
    v-else-if="resolve(field?.type) === 'string'"
    :key="`input-${field.name}-${updates}-${fieldClass}`"
    v-model="value"
    :label="resolve(field.label || field.name)"
    :name="field.name"
    :placeholder="field.placeholder"
    :disabled="resolve(field.disabled)"
    :class="fieldClass"
    autocomplete="off"
  />
  <AppChipsInput
    v-else-if="resolve(field?.type) === 'strings array'"
    :key="`chips-input-${field.name}-${updates}-${fieldClass}`"
    v-model="value"
    :label="resolve(field.label || field.name)"
    :name="field.name"
    :placeholder="field.placeholder"
    :disabled="resolve(field.disabled)"
    :class="fieldClass"
    autocomplete="off"
  />
  <AppInput
    v-else-if="resolve(field?.type) === 'number'"
    :key="`number-input-${field.name}-${updates}-${fieldClass}`"
    v-model="value"
    :label="resolve(field.label || field.name)"
    :name="field.name"
    :placeholder="field.placeholder"
    :disabled="resolve(field.disabled)"
    :class="fieldClass"
    autocomplete="off"
    type="number"
  />
  <AppCheckbox
    v-else-if="resolve(field?.type) === 'boolean'"
    :key="`check-${field.name}-${updates}-${fieldClass}`"
    v-model="value"
    :label="resolve(field.label || field.name)"
    :name="field.name"
    :disabled="resolve(field.disabled)"
    :class="fieldClass"
  />
  <AppFile
    v-else-if="resolve(field?.type) === 'file'"
    :key="`file-${field.name}-${updates}-${fieldClass}`"
    v-model="value"
    :label="resolve(field.label || field.name)"
    :name="field.name"
    :disabled="resolve(field.disabled)"
    :class="fieldClass"
  />
</template>

<script setup lang="ts">
import { Ref } from 'vue';

import {
  Field,
  OperationPayload,
  PayloadCallbackOr,
  PayloadWithOptions
} from '@/types/operations';

const props = defineProps<{
  field: Field;
  subfieldIndex?: number;
  parentField?: string;
}>();

const updates = ref(0);

const operationValues = inject('operation-values') as Ref<
  OperationPayload<PayloadWithOptions>
>;

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

const resolve = <T>(value: PayloadCallbackOr<T>): T => {
  if (value instanceof Function) {
    return value(operationValues.value, props.subfieldIndex);
  }
  return value;
};

watch(operationValues, () => {
  updates.value++;
});
</script>
