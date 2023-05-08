<template>
  <DropZone
    button-caption="Upload"
    dropzone-caption="Drop your file here"
    @update:public-url="onFileUploaded"
    @error="error => console.error(error)"
  />
</template>
<script setup lang="ts">
const onFileUploaded = (filepath: string, extension: string) => {
  const fixedFileName = filepath + '#' + extension;
  console.log('[DEBUG] File upload', filepath, extension, fixedFileName);
};
</script>
