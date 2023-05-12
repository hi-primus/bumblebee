<template>
  <Popup
    class="popup-narrow"
    closable
    :title="title"
    @close="emit('close')"
    @keydown.escape="emit('close')"
  >
    <div class="flex flex-col gap-7">
      <div class="text-neutral-light text-center">
        {{ message }}
      </div>
      <form
        class="flex flex-col items-stretch gap-4"
        @submit.prevent="emit('accept', $event)"
      >
        <template v-if="fields?.length">
          <component
            :is="field.component"
            v-for="field in fields"
            :key="field.name"
            v-bind="fieldBind(field)"
          >
            {{ field.content }}
          </component>
        </template>
        <div class="grid grid-cols-2 gap-2">
          <AppButton
            class="layout-invisible"
            type="button"
            @click="emit('close')"
          >
            {{ cancelLabel || 'Cancel' }}
          </AppButton>
          <AppButton class="accept-button color-primary" type="submit">
            {{ acceptLabel || 'Accept' }}
          </AppButton>
        </div>
      </form>
    </div>
  </Popup>
</template>

<script setup lang="ts">
import { ComponentInfo } from '@/types/app';

defineProps({
  title: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: ''
  },
  acceptLabel: {
    type: String,
    default: 'Accept'
  },
  cancelLabel: {
    type: String,
    default: 'Cancel'
  },
  fields: {
    type: Array as PropType<ComponentInfo[]>,
    default: null
  }
});

const emit = defineEmits(['close', 'accept']);

const fieldBind = (
  field: ComponentInfo
): Omit<ComponentInfo, 'component' | 'content'> => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { component: _component, content: _content, ...newField } = field;
  return newField;
};
</script>
