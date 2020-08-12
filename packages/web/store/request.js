import axios from 'axios'

const baseUrl = process.env.API_URL || 'http://localhost:5000'

export const actions = {

	async uploadFile (context, {file}) {

    const uploadResponse = await context.dispatch('request', {
      request: 'post',
      path: '/datasource/upload',
      payload: {
        name: file.name,
        size: file.size,
        type: file.type
      }
    }, { root: true })

    const response = await axios.put(uploadResponse.data.url,
      file,
      {
        headers: {
          'Content-Type': file.type
        }
      }
    )

    var path = response.data.path.split('public/').join('').replace(/\b\\\b/g,"/")

    var fileOriginalName = file.name
    var fileUrl = baseUrl + '/' + path
    var fileType = undefined
    var datasetName = undefined

    try {

      var originalName = response.data.originalname

      if (fileOriginalName!==originalName) {
        console.warn('Bad file name', fileOriginalName, originalName)
      }
      fileType = originalName.split('.')
      fileType = fileType[fileType.length - 1]
      if (!['csv','xls','json','avro','parquet'].includes(fileType)) {
        throw new Error()
      }
      datasetName = originalName.split(fileType)[0]
    } catch (error) {
      fileType = undefined
      console.warn('Bad file name', originalName)
    }

    if (!fileUrl || !fileType || !datasetName) {
      console.warn('Bad file name', { fileUrl, fileType, datasetName, responseData: response.data } )
    }

    return {fileUrl, fileType, datasetName, fileOriginalName}

  },

}

