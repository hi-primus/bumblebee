import { TYPES_HINTS, TYPES_NAMES } from '@/utils/constants.js'

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
