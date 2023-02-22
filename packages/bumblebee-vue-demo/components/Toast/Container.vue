<template>
  <div class="flex flex-col gap-3">
    <Toast
      v-for="(toast, index) in toasts"
      :key="toast.id || index"
      :class="toast.class"
      :title="toast.title"
      :message="toast.message"
      :type="toast.type"
      :icon="toast.icon"
      :closable="toast.closable"
      :action-label="toast.action"
      :time="toast.time"
      @close="toasts = toasts.filter(t => t.id !== toast.id)"
      @action="toast.actionCallback ? toast.actionCallback($event) : null"
    />
  </div>
</template>

<script setup lang="ts">
const { toasts, addToast } = useToasts();

defineExpose({
  addToast
});

onMounted(() => {
  // add to global window object for debugging
  window.addToast = addToast;
});
</script>
