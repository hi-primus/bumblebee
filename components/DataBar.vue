<template>
  <div class="data-bar">
    <v-tooltip :left="!bottom" :bottom="bottom" content-class="bar-tooltip" color="success darken-2">
      <template v-slot:activator="{ on }">
        <div :class="{'data-bar-min': okP!=0}" :style="{'width': okP+'%'}" class="data-bar-green" v-on="on" />
      </template>
      <span>{{ okValues }} valid values <span>{{ okP }}%</span></span>
    </v-tooltip>
    <v-tooltip :left="!bottom" :bottom="bottom" content-class="bar-tooltip" color="error darken-2">
      <template v-slot:activator="{ on }">
        <div :class="{'data-bar-min': mismatchedP!=0}" :style="{'width': mismatchedP+'%'}" class="data-bar-red" v-on="on" />
      </template>
      <span>{{ mismatched }} mismatched values <span>{{ mismatchedP }}%</span></span>
    </v-tooltip>
    <v-tooltip :left="!bottom" :bottom="bottom" content-class="bar-tooltip" background-color="#6c7680" color="#6c7680">
      <template v-slot:activator="{ on }">
        <div :class="{'data-bar-min': missingP!=0}" class="data-bar-grey" v-on="on" />
      </template>
      <span>{{ missing }} missing values <span>{{ missingP }}%</span></span>
    </v-tooltip>
  </div>
</template>

<script>
export default {
	props: {
		missing: {
			default: 0,
			type: Number
		},
		mismatched: {
			default: 0,
			type: Number
		},
		total: {
			default: 1,
			type: Number
		},
		bottom: {
			default: false,
			type: Boolean
		}
	},

	data () {
		return {
			okP: 0,
			missingP: 0,
			okValues: 0,
			mismatchedP: 0
		}
	},

	beforeMount () {
		this.okValues = this.total - (this.missing + this.mismatched)
		this.missingP = (+((this.missing * 100) / this.total)).toFixed(2) // nh
		this.mismatchedP = (+((this.mismatched * 100) / this.total)).toFixed(2) // nh
		this.okP = (+((this.okValues * 100) / this.total)).toFixed(2) // nh
	}
}
</script>

<style lang="scss" scoped>
* {
	color: #fff !important;
}

.bar-tooltip {
  opacity: 1 !important;
  &>span>span {
    opacity: 0.8;
  }
}
</style>
