<template>
  <div
    :key="`${name} ${updates}`"
    class="input file-input"
    :class="[attrClass]"
    :style="(attrStyle as StyleValue)"
  >
    <label v-if="label" :for="name" class="label input-label file-input-label">
      {{ label }}
    </label>
    <div class="input-field file-input-inputContainer">
      <input
        :name="name"
        type="file"
        class="file-input-hiddenField"
        v-bind="attrs"
        @change="updateFile"
      />
      <span
        class="block truncate file-input-fieldText"
        :class="[!myValue ? 'file-input-fieldTextDefault' : '']"
      >
        {{ myValue?.name || placeholder || 'Select a file' }}
      </span>
      <div class="icons">
        <button type="button" @click="myValue = null">
          <Icon
            v-if="clearable && myValue"
            :path="mdiClose"
            class="clearIcon w-6"
          />
        </button>
        <Icon :path="mdiPaperclip" class="file-input-fieldIcon min-w-8" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { mdiClose, mdiPaperclip } from '@mdi/js';
import { PropType, StyleValue } from 'vue';

import { FileWithId } from '@/types/app';

export default {
  inheritAttrs: false
};
</script>

<script setup lang="ts">
const props = defineProps({
  modelValue: {
    type: Object as PropType<FileWithId>,
    default: () => null
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  name: {
    type: String,
    default: () => 'myValue'
  },
  clearable: {
    type: Boolean,
    default: true
  }
});

const { class: attrClass, style: attrStyle, ...attrs } = useAttrs();

const emit = defineEmits(['update:modelValue']);

const updates = ref(0);

const myValue = computed<FileWithId | null>({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
});

const updateFile = (event: Event) => {
  updates.value = updates.value + 1;
  const file = (event?.target as HTMLInputElement)?.files?.[0];
  if (file) {
    const id = `${file.name}-${Date.now()}-${Math.random()
      .toString()
      .slice(2)}`;
    (file as FileWithId).id = id;
    myValue.value = file as FileWithId;
  }
};
</script>
