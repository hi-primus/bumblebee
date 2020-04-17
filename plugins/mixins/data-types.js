export default {
	data () {
		return {

		}
	},

	methods: {
		dataType (data) {
			switch (data) {
      case 'integer':
      case 'int':
      case 'int64':
        return '#'
      case 'decimal':
      case 'float':
      case 'float64':
      case 'double':
        return '#.##'
      case 'string':
				return 'ABC'
      case 'boolean':
        return '0/1'
      case 'array':
        return '[ ]'
      case 'object':
        return 'obj'
      case 'gender':
        return 'gen'
      case 'ip':
        return 'ip'
      case 'url':
        return 'url'
      case 'email':
        return 'a@b'
      case 'credit_card_number':
        return '####'
      case 'zip_code':
        return 'zip'

      case 'date':
      case 'timestamp':
      case 'time':
        return '🕓'

			case 'string*':
				return 'ABC*'
			case 'binary':
				return '0101'
      case 'categorical':
        return 'cat'
			default:
        return data.substring(0,3)

			}
		}
	}

}
