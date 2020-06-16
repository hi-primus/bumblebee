import Vue from 'vue'
/*bu*/ import { getProperty } from 'bumblebee-utils' /*bu*/

Vue.filter('property', function ({value, args}) {
	return getProperty(value, args)
})
