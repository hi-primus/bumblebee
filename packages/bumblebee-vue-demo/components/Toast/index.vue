<template>
  <div
    class="toast font-title min-h-16 flex items-center rounded-lg pr-2 text-[color:var(--toast-text-color)] bg-[color:var(--toast-color)]"
    :class="{
      'toast-success': props.type === 'success',
      'toast-error': props.type === 'error',
      'toast-warn': props.type === 'warning',
      'toast-primary': props.type === 'info'
    }"
  >
    <div
      v-if="icon"
      class="h-16 w-16 text-3xl flex justify-center items-center mr--6"
    >
      <Icon :path="icon" />
    </div>
    <div class="flex-1 flex flex-col justify-center items-start py-2 pl-6 pr-4">
      <div class="text-lg">
        {{ props.title }}
      </div>
      <div v-if="props.message" class="text-xs">
        {{ props.message }}
      </div>
    </div>
    <AppButton
      v-if="props.actionLabel"
      class="text-lg font-normal cursor-pointer underline pr-4"
      @click="emit('action')"
    >
      {{ props.actionLabel }}
    </AppButton>
    <div
      v-if="props.closable"
      class="h-16 w-16 text-3xl flex justify-center items-center ml--6 mr--2"
    >
      <button @click="emit('close')">
        <Icon :path="mdiClose" />
      </button>
    </div>
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

onMounted(() => {
  if (props.time) {
    setTimeout(() => {
      emit('close');
    }, props.time * 1000);
  }
});
</script>
