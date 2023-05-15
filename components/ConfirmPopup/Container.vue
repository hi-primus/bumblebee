<template>
  <div class="display-none">
    <ConfirmPopup
      v-for="popup in popups"
      :id="`confirm-popup-${popup.id}`"
      :key="popup.id"
      :title="popup.title"
      :message="popup.message"
      :accept-label="popup.acceptLabel"
      :cancel-label="popup.cancelLabel"
      :fields="popup.fields"
      @close="popup.cancel()"
      @accept="popup.accept($event)"
    />
  </div>
</template>

<script setup lang="ts">
const { popups } = useConfirmPopup();
</script>
