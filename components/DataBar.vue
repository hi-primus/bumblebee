<template>
  <div class="data-bar">
    <v-tooltip transition="fade-transition" :left="!bottom" :bottom="bottom" content-class="bar-tooltip" color="success darken-2">
      <template v-slot:activator="{ on }">
        <div :class="{'data-bar-min': okP!=0}" :style="{'width': okP+'%'}" class="data-bar-green" v-on="on" />
      </template>
      <span>{{ okValues }} valid values <span class="percentage">{{ okP }}%</span></span>
    </v-tooltip>
    <v-tooltip transition="fade-transition" :left="!bottom" :bottom="bottom" content-class="bar-tooltip" color="error darken-2">
      <template v-slot:activator="{ on }">
        <div :class="{'data-bar-min': mismatchP!=0}" :style="{'width': mismatchP+'%'}" class="data-bar-red" v-on="on" />
      </template>
      <span>{{ mismatch }} mismatches values <span class="percentage">{{ mismatchP }}%</span></span>
    </v-tooltip>
    <v-tooltip transition="fade-transition" :left="!bottom" :bottom="bottom" content-class="bar-tooltip" background-color="#6c7680" color="#6c7680">
      <template v-slot:activator="{ on }">
        <div :class="{'data-bar-min': missingP!=0}" class="data-bar-grey" v-on="on" />
      </template>
      <span>
        {{ missing | humanNumberInt}} missing values <span class="percentage">{{ missingP }}%</span><br/>
        {{ nullV | humanNumberInt}} null values <span class="percentage">{{ nullP }}%</span><br/>
        {{ missing+nullV | humanNumberInt}} total values <span class="percentage">{{ missingP + nullP }}%</span>
      </span>
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
		nullV: {
			default: 0,
			type: Number
		},
		mismatch: {
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
			nullP: 0,
      okValues: 0,
      mismatchP: 0
		}
	},

	beforeMount () {
		this.okValues = this.total - (this.missing + this.nullV + this.mismatch)
		this.missingP = +(+((this.missing * 100) / this.total)).toFixed(2) // nh
		this.nullP = +(+((this.nullV * 100) / this.total)).toFixed(2) // nh
		this.mismatchP = +(+((this.mismatch * 100) / this.total)).toFixed(2) // nh
		this.okP = +(+((this.okValues * 100) / this.total)).toFixed(2) // nh
	}
}
</script>

<style lang="scss" scoped>
* {
	color: #fff !important;
}

.bar-tooltip.menuable__content__active {
  opacity: 1 !important;
  &>span>span {
    opacity: 0.8;
  }
}
</style>
