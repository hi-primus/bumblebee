<template>
  <Teleport to="body">
    <div
      :style="attrStyle"
      :class="attrClass"
      class="popup w-full h-screen absolute top-0 left-0 z-30 bg-black/30 flex items-center justify-center"
      @click="emit('close')"
    >
      <div
        class="popup-window relative bg-white rounded-lg min-w-[300px] max-w-[calc(100%-64px)] max-h-[calc(100vh-5rem)]"
        @click.stop
      >
        <div v-if="title || closable" class="popup-header flex items-center">
          <h3 v-if="title" class="text-lg font-medium text-text relative">
            {{ title }}
          </h3>
          <AppButton
            v-if="closable"
            class="btn-icon btn-layout-invisible btn-color-text ml-auto mr-[-7px]"
            @click="() => emit('close')"
          >
            <Icon :path="mdiClose" />
          </AppButton>
        </div>
        <div class="min-h-[48px] w-[500px]">
          <slot :close="() => emit('close')"></slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { mdiClose } from '@mdi/js';

const { class: attrClass, style: attrStyle } = useAttrs();

defineProps({
  closable: {
    type: Boolean,
    default: true
  },
  title: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['close']);
</script>
