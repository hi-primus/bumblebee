export default {
	data () {
		return {

		}
	},

	methods: {
		dataType (data) {
      switch (data) {
        case 'string':
          return 'ABC'
        case 'null':
          return 'null'
        case 'int':
          return '#'
        case 'float':
        case 'double':
        case 'decimal':
          return '#.##'
        case 'binary':
          return '0101'
        case 'boolean':
          return '0/1'
        case 'array':
          return '[ ]'
        case 'date':
          return '🕓'
        default:
          return data
      }
		}
	}

}
