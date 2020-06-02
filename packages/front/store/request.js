import axios from 'axios'

const baseUrl = process.env.API_URL || 'http://localhost:5000'

export const actions = {

	async uploadFile (context, {file}) {

    var formData = new FormData();
    formData.append('datasetFile',file)

    const response = await axios.post(baseUrl+'/upload',
      formData,
      {
        headers: {
            'Content-Type': 'multipart/form-data'
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

