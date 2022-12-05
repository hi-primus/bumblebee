<template>
  <Teleport to="body">
    <div
      class="w-full h-screen absolute top-0 left-0 z-10 bg-black/80 flex items-center justify-center"
    >
      <div
        class="relative bg-gray-50 rounded-lg w-120 p-5 border-2 border-black max-h-[calc(100vh-5rem)]"
        :class="{
          'pt-8': closable
        }"
      >
        <AppButton
          v-if="closable"
          class="absolute right-3 top-3"
          variant="roundedIcon"
          @click="emit('close')"
        >
          <Icon :path="mdiClose" />
        </AppButton>
        <slot :close="() => emit('close')"> </slot>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { mdiClose } from '@mdi/js';

defineProps({
  closable: {
    type: Boolean,
    default: true
  },
});

const emit = defineEmits(['close']);
</script>
