import Vue from 'vue'
import { getProperty } from 'bumblebee-utils'

Vue.filter('property', function ({value, args}) {
	return getProperty(value, args)
})
