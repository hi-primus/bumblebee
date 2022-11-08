<template>
  <div
    class="workspace-toolbar bg-white border-line-light border-solid border-b min-h-[64px]"
  >
    <Toolbar
      :tools="toolbarButtons"
    />
  </div>
</template>

<script setup lang="ts">
import { mdiUpload, mdiArrowSplitVertical, mdiCodeTags, mdiMagnify } from '@mdi/js';
const toolbarButtons = [
  {
    name: 'Load',
    label: 'Load',
    icon: mdiUpload
  },
  {
    name: 'Unnest columns',
    label: 'Unnest<br/>cols.',
    icon: mdiArrowSplitVertical
  },
  {
    name: 'Search',
    label: 'Search in<br/>workspace',
    icon: mdiMagnify,
    class: 'ml-auto'
  },
  {
    name: 'View operations',
    label: 'View<br/>operations',
    icon: mdiCodeTags,
  }
]
</script>
