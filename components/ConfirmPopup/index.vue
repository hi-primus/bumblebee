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
      <div class="grid grid-cols-2 gap-2">
        <AppButton class="layout-invisible" @click="emit('close')">
          {{ cancelLabel || 'Cancel' }}
        </AppButton>
        <AppButton class="accept-button color-primary" @click="emit('accept')">
          {{ acceptLabel || 'Accept' }}
        </AppButton>
      </div>
    </div>
  </Popup>
</template>

<script setup lang="ts">
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
  }
});

const emit = defineEmits(['close', 'accept']);
</script>
