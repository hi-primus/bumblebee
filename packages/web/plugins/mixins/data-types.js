import bbUtils from 'bumblebee-utils'

const { TYPES_HINTS, TYPES_NAMES } = bbUtils

export default {
	data () {
		return {
      dataTypeNames: TYPES_NAMES
		}
	},

	methods: {
		dataTypeHint (data) {
      return TYPES_HINTS[data] || (data || 'und').substring(0,3)
		}
	}

}
