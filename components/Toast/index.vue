<template>
  <div
    class="toast font-title min-h-16 flex items-center rounded-lg px-4 gap-4 text-[color:var(--toast-text-color)] bg-[color:var(--toast-color)]"
    :class="{
      'color-info': props.type === 'info',
      'color-success': props.type === 'success',
      'color-error': props.type === 'error',
      'color-warning': props.type === 'warning'
    }"
  >
    <div v-if="icon" class="h-16 w-6 text-3xl flex justify-center items-center">
      <Icon :path="icon" />
    </div>
    <div
      class="flex-1 flex flex-col justify-center items-start pt-[0.3rem] pb-[0.4rem]"
    >
      <div class="text-lg">
        {{ props.title }}
      </div>
      <div
        v-if="props.message"
        class="w-[calc(100%-3rem)] text-xs whitespace-pre-wrap break-words max-h-24 overflow-y-auto"
      >
        {{ props.message }}
      </div>
    </div>
    <AppButton
      v-if="props.actionLabel"
      class="text-lg font-normal cursor-pointer underline"
      @click="emit('action')"
    >
      {{ props.actionLabel }}
    </AppButton>
    <button
      v-if="props.closable"
      class="h-16 w-16 text-3xl flex justify-center items-center -mr-4"
      type="button"
      @click="emit('close')"
    >
      <Icon :path="mdiClose" />
    </button>
  </div>
</template>

<script setup lang="ts">
import {
  mdiAlertCircleOutline,
  mdiCheckCircleOutline,
  mdiClose,
  mdiCloseCircleOutline,
  mdiInformationOutline
} from '@mdi/js';
import { PropType } from 'vue';

const emit = defineEmits(['close', 'action']);

const props = defineProps({
  title: {
    type: String,
    default: 'Error'
  },
  message: {
    type: String
  },
  type: {
    type: String as PropType<'success' | 'error' | 'warning' | 'info'>
  },
  icon: {
    type: String
  },
  closable: {
    type: Boolean,
    default: true
  },
  actionLabel: {
    type: String
  },
  time: {
    type: Number,
    default: 30
  }
});

const defaultIcons = {
  success: mdiCheckCircleOutline,
  error: mdiCloseCircleOutline,
  warning: mdiAlertCircleOutline,
  info: mdiInformationOutline
};

const icon = computed(() => {
  if (props.type && defaultIcons[props.type] && !props.icon) {
    return defaultIcons[props.type];
  }
  return props.icon;
});

onMounted(async () => {
  if (props.time) {
    await new Promise(resolve => setTimeout(resolve, props.time * 1000));
    emit('close');
  }
});
</script>
