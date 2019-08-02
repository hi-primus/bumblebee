import Vue from 'vue'
const numeral = require('numeral')

Vue.filter('formatNumber', function (value) {
	if (value < 0) {
		return '(' + numeral(value).format('0 a') + ')'
	} else {
		return numeral(value).format('0 a')
	}
})
