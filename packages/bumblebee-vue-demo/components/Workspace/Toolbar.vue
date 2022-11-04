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
import { mdiUpload, mdiArrowSplitVertical } from '@mdi/js';
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
  }
]
</script>
