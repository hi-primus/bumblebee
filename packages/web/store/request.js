const baseUrl = process.env.API_URL || 'http://localhost:4000'

export const actions = {

	async uploadFile (context, {file, attachment}) {

    var uploadPayload = {
      name: file.name,
      size: file.size,
      type: file.type,
      workspace: context.rootState.workspace._id
    };

    const uploadResponse = await context.dispatch('request', {
      request: 'post',
      path: '/datasource/upload',
      payload: uploadPayload
    }, { root: true });

    var fileUrl = uploadResponse.data.url;

    const config = {
      onUploadProgress(progressEvent) {
        attachment.setProgress((progressEvent.loaded / progressEvent.total) * 100);
      },
      headers: {
        'Content-Type': file.type,
        'x-amz-acl': 'public-read',
        'Authorization': '',
      }
    };

    var fileOriginalName = file.name;

    if (fileUrl.includes(baseUrl)) {
      let formData = new FormData();
      formData.append('file', file);
      file = formData;
    }

    const response = await this.$axios.put(fileUrl,
      file,
      config
    );

    fileUrl = fileUrl.split('?')[0];

    var fileType = undefined;
    var datasetName = undefined;

    try {
      fileType = fileOriginalName.split('.');
      fileType = fileType[fileType.length - 1];
      if (!['csv','xls','json','avro','parquet'].includes(fileType)) {
        throw new Error();
      }
      datasetName = fileOriginalName.split(fileType)[0];
    } catch (error) {
      fileType = undefined;
      console.warn('Bad file name', fileOriginalName);
    }

    if (!fileUrl || !fileType || !datasetName) {
      console.warn('Bad file name', { fileUrl, fileType, datasetName, responseData: response.data });
    }

    return {fileUrl, fileType, datasetName, fileOriginalName};

  },

}

