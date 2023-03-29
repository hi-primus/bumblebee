<template>
  <div class="display-none">
    <ConfirmationPopup
      v-for="popup in popups"
      :key="popup.id"
      :title="popup.title"
      :message="popup.message"
      :accept-label="popup.acceptLabel"
      :cancel-label="popup.cancelLabel"
      @close="popup.cancel()"
      @accept="popup.accept()"
    />
  </div>
</template>

<script setup lang="ts">
const { popups } = useConfirmationPopup();
</script>
