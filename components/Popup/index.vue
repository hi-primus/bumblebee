<template>
  <Teleport to="body">
    <div
      v-bind="attrs"
      class="popup-container w-full h-screen absolute top-0 left-0 z-30 bg-black/30 flex items-center justify-center"
      @click="emit('close')"
    >
      <div
        class="popup relative bg-white rounded-lg min-w-[300px] max-w-[calc(100%-64px)] max-h-[calc(100vh-5rem)]"
        :class="attrClass"
        :style="(attrStyle as StyleValue)"
        @click.stop
      >
        <div v-if="title || closable" class="popup-header flex items-center">
          <h3 v-if="title" class="text-lg font-medium text-neutral relative">
            {{ title }}
          </h3>
          <AppButton
            v-if="closable"
            class="type-icon layout-invisible color-neutral opacity-80 ml-auto mr-[-8px] min-w-9 h-9"
            @click="() => emit('close')"
          >
            <Icon :path="mdiClose" />
          </AppButton>
        </div>
        <div class="min-h-[48px] w-full">
          <slot :close="() => emit('close')"></slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts">
import { mdiClose } from '@mdi/js';
import { StyleValue } from 'vue';

export default {
  inheritAttrs: false
};
</script>

<script setup lang="ts">
const { class: attrClass, style: attrStyle, ...attrs } = useAttrs();

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
