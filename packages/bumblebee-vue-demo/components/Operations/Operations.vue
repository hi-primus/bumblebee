<template>
  <li>
    <div class="flex gap-2 justify-end mb-2" :class="{ hidden: !editing }">
      <button
        type="button"
        class="px-1 pt-1 cursor-pointer flex flex-col items-center rounded-md text-text"
      >
        <Icon :path="mdiContentSaveOutline" class="text-text/75"> </Icon>
      </button>
      <button
        type="button"
        class="px-1 pt-1 cursor-pointer flex flex-col items-center rounded-md text-text"
      >
        <Icon :path="mdiPencil" class="text-text/75"> </Icon>
      </button>
      <button
        type="button"
        class="px-1 pt-1 cursor-pointer flex flex-col items-center rounded-md text-text"
      >
        <Icon :path="mdiDelete" class="text-text/75"> </Icon>
      </button>
    </div>
    <div
      class="rounded-md border-text-lightest font-mono px-4 py-2"
      :class="{
        'bg-primary-lightest': editing,
        'bg-white': !editing
      }"
    >
      <span class="mr-4 text-text-lightest">{{ index + 1 }}</span>
      <span class="bg-white">
        <span class="font-semibold">Load</span>
        'abcdefaaaaaaaaaaaaaaaaaaaaaaaa-ssssssssssg.csv' file
      </span>
    </div>
  </li>
</template>
<script setup lang="ts">
import { mdiContentSaveOutline, mdiDelete, mdiPencil } from '@mdi/js';
import { ref } from 'vue';

defineProps({
  index: {
    type: Number,
    required: true
  }
});

const editing = ref(true);
</script>
