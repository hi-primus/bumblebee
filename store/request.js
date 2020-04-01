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

    var fileUrl = baseUrl + '/' + response.data.path.split('public/')[0]
    var fileType = undefined
    var fileName = undefined

    try {
      fileType = response.data.originalname.split('.')
      fileType = fileType[fileType.length - 1]
      if (!['csv','xls','json','avro','parquet'].includes(fileType)) {
        throw new Error()
      }
      fileName = response.data.originalname.split(fileType)[0]
    } catch (error) {
      fileType = undefined
      console.warn('Bad file name', response.data.originalname)
    }

    return {fileUrl, fileType, fileName}

  },

}

