<template>
  <div>
    <div v-bind="getRootProps()">
      <input v-bind="getInputProps()" />
      <p v-if="isDragActive">Drop your files here...</p>
      <p v-else>{{ props.dropzoneCaption }}</p>
    </div>
    <AppButton @click="open">
      {{ props.buttonCaption }}
    </AppButton>
  </div>
</template>

<script setup>
import { useDropzone } from 'vue3-dropzone';

const progressInButton = ref(false);
const fileUploaded = ref(false);

const getExtension = urlOrFilename => {
  if (!urlOrFilename) {
    return null; // or return a default value as needed
  }
  const filename = urlOrFilename.split('/').pop();
  const extension = '.' + filename.split('.').pop();
  return extension;
};
const props = defineProps({
  buttonCaption: {
    type: String,
    default: ''
  },
  dropzoneCaption: {
    type: String,
    default: ''
  }
});

const emit = defineEmits([
  'update:publicUrl',
  'update:progress',
  'update:fileUploaded',
  'error'
]);

const state = reactive({
  files: [],
  multiple: false
});

const { nhost } = useNhostClient();

const FILE_FORMATS = ['.csv', '.xls', '.json'];

const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
  onDrop,
  accept: FILE_FORMATS
});

function onDrop(acceptFiles, rejectReasons) {
  console.log('[DEBUG] onDrop', acceptFiles, rejectReasons);
  state.files = acceptFiles;
  onSubmitFile();
}

async function upload({ file }) {
  const { id, isUploaded } = await nhost.storage.putFile({
    file,
    path: '/public'
  });
  return { id, isUploaded };
}

async function onSubmitFile() {
  try {
    progressInButton.value = true;
    console.log('[DEBUG] Files', state.files);
    const { id: documentId, isUploaded } = await upload({
      file: state.files[0]
    });

    if (isUploaded) {
      progressInButton.value = false;
      fileUploaded.value = true;
      const extension = getExtension(state.files[0].name);

      const filepath = await nhost.storage.getPublicUrl({
        fileId: documentId
      });

      emit('update:publicUrl', filepath, extension);
    }
  } catch (error) {
    progressInButton.value = true;
    emit('error', error);
    console.error(error);
  }
}
</script>
