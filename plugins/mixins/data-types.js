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
        case 'int':
          return '#'
        case 'float':
        case 'double':
          return '##.#'
        case 'boolean':
          return '0/1'
        case 'date':
          return '##/##/####'
        default:
          return ''
      }
		}
	}

}
