<template>
  <div class="file-input-container" :class="[attrClass]" :style="(attrStyle as StyleValue)">
    <label v-if="label" :for="name" class="label file-input-label">
      {{ label }}
    </label>
    <div class="file-input-inputContainer">
      <input
        @change="updateFile"
        :name="name"
        type="file"
        class="file-input-hiddenField"
        v-bind="attrs"
      />
      <!-- :placeholder="placeholder" -->
        <span
          class="block truncate file-input-fieldText"
          :class="[!myValue ? 'file-input-fieldTextDefault' : '']"
        >
          {{ myValue?.name || title || 'Select a file' }}
        </span>
        <span
          class="
            pointer-events-none
            absolute
            inset-y-0
            right-0
            flex
            items-center
            pr-4
          "
        >
        <Icon
          :path="mdiPaperclip"
          :class="'file-input-fieldIcon'"
        />
      </span>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  inheritAttrs: false,
};
</script>

<script setup lang="ts">
import { mdiPaperclip } from '@mdi/js';
import { StyleValue } from 'vue';


const props = defineProps({
  modelValue: {
    type: Object,
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
  title: {
    type: String,
    default: () => null,
  },
  name: {
    type: String,
    default: () => "myValue",
  },
});

const { class: attrClass, style: attrStyle, ...attrs } = useAttrs();

const emit = defineEmits(["update:modelValue"]);

const myValue = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const updateFile = (event: Event) => {
  const target = event?.target as HTMLInputElement;
  myValue.value = target?.files ? target.files[0] : false || myValue.value;
}

</script>

