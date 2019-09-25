import Vue from 'vue'
const numeral = require('numeral')

Vue.filter('humanNumber', function (value) {
	if (value < 0) {
		return '(' + numeral(value).format('0.0a') + ')'
	} else {
		return numeral(value).format('0.0a')
	}
})

Vue.filter('humanNumberInt', function (value) {
	if (value < 0) {
		return '(' + numeral(value).format('0a') + ')'
	} else {
		return numeral(value).format('0a')
	}
})

Vue.filter('formatNumber', function (value) {
	return numeral(value).format('0,0.00')
})

Vue.filter('formatNumberInt', function (value) {
	return numeral(value).format('0,0')
})
