<template>
  <AppSelector
    v-if="field.options?.length"
    :key="`selector-${field.name}`"
    v-model="operationValues[field.name]"
    :options="field.options"
    :text-callback="field.textCallback"
    :label="field.label || field.name"
    :name="field.name"
    :placeholder="field.placeholder"
    :class="field.class || 'w-full'"
  />
  <AppInput
    v-else-if="field.type === 'string'"
    :key="`input-${field.name}`"
    v-model="operationValues[field.name]"
    :label="field.label || field.name"
    :name="field.name"
    :placeholder="field.placeholder"
    :class="field.class || 'w-full'"
  />
  <AppCheckbox
    v-else-if="field.type === 'boolean'"
    :key="`check-${field.name}`"
    v-model="operationValues[field.name]"
    :label="field.label || field.name"
    :name="field.name"
    :class="field.class || 'w-full'"
  />
</template>

<script setup lang="ts">
import { Ref } from 'vue';

import { Field, Payload } from '@/types/operations';

defineProps<{
  field: Field;
}>();

const operationValues = inject('operation-values') as Ref<Payload>;
</script>
