import { FileWithId, UploadFileResponse } from '@/types/app';

const alreadyUploadedFiles: Record<string, UploadFileResponse> = {};

export default function () {
  // avoid using useNhostClient() to avoid errors on installations without nhost

  const nuxtApp = useNuxtApp();

  const nhost = nuxtApp.$nhost;

  async function uploadFile(
    fileOrArrayBuffer: ArrayBuffer | File | FileWithId,
    fileName?: string
  ): Promise<UploadFileResponse> {
    if (!nhost) {
      return { error: 'Upload not available' };
    }

    if (
      'id' in fileOrArrayBuffer &&
      fileOrArrayBuffer.id &&
      alreadyUploadedFiles[fileOrArrayBuffer.id]
    ) {
      console.log('[DEBUG] File already uploaded', fileOrArrayBuffer);
      return {
        ...alreadyUploadedFiles[fileOrArrayBuffer.id],
        error: null
      } as UploadFileResponse;
    }

    let file: File;

    if (fileOrArrayBuffer instanceof ArrayBuffer) {
      file = new File([fileOrArrayBuffer], fileName || 'file.csv');
    } else {
      file = fileOrArrayBuffer;
    }

    console.log('[DEBUG] Uploading file (id not found)', file);

    const { fileMetadata, error } = await nhost.storage.upload({
      file
    });

    if (!fileMetadata || !fileMetadata.id) {
      return {
        fileMetadata,
        error: error || fileMetadata?.error || 'Upload failed'
      };
    }

    const filepath = nhost.storage.getPublicUrl({
      fileId: fileMetadata.id
    });

    if ('id' in file && file.id) {
      alreadyUploadedFiles[file.id] = { fileMetadata, filepath };
    }

    return { fileMetadata, filepath, error };
  }

  return {
    uploadFile
  };
}
