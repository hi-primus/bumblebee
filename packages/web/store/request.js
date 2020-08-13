import axios from 'axios'

const baseUrl = process.env.API_URL || 'http://localhost:5000'

export const actions = {

	async uploadFile (context, {file, attachment}) {

    var uploadPayload = {
      name: file.name,
      size: file.size,
      type: file.type
    };

    const uploadResponse = await context.dispatch('request', {
      request: 'post',
      path: '/datasource/upload',
      payload: uploadPayload
    }, { root: true })

    console.log({uploadPayload, uploadResponse})

    var fileUrl = uploadResponse.data.url

    var blob = new Blob([file], {type: file.type});
    var formData = new FormData();
    formData.append('name',file)

    const config = {
      onUploadProgress(progressEvent) {
        attachment.setProgress(progressEvent.loaded / progressEvent.total * 100);
      },
      headers: {
        'Content-Type': file.type,
        'x-amz-acl': 'public-read',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site',
        'Connection': 'keep-alive',
        'Authorization': '',
      }
    }

    console.log({fileUrl, file, formData, blob, config})

    const response = await axios.put(fileUrl,
      file,
      config
    )

    fileUrl = fileUrl.split('?')[0]

    var fileOriginalName = file.name
    var fileType = undefined
    var datasetName = undefined

    try {
      fileType = fileOriginalName.split('.')
      fileType = fileType[fileType.length - 1]
      if (!['csv','xls','json','avro','parquet'].includes(fileType)) {
        throw new Error()
      }
      datasetName = fileOriginalName.split(fileType)[0]
    } catch (error) {
      fileType = undefined
      console.warn('Bad file name', fileOriginalName)
    }

    if (!fileUrl || !fileType || !datasetName) {
      console.warn('Bad file name', { fileUrl, fileType, datasetName, responseData: response.data } )
    }

    return {fileUrl, fileType, datasetName, fileOriginalName}

  },

}

