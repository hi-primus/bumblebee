import Vue from 'vue'
import { getProperty } from '@/utils/functions.js'

Vue.filter('property', function ({value, args}) {
	return getProperty(value, args)
})
