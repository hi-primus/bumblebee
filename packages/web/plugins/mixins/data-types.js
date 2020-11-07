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
      return data ? (TYPES_HINTS[data] || (data).substring(0,3)) : 'und';
		}
	}

}
