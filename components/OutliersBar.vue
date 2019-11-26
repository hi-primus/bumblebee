<template>
  <div class="outliers-bar" style="font-size: 24px;">
    <v-tooltip transition="fade-transition" bottom content-class="bar-tooltip tooltip-above-dialog" color="error darken-2">
      <template v-slot:activator="{ on }">
        <div :class="{'min-bar': lowerW!=0}" :style="{'width': lowerW+'%'}" class="bar red-bar" v-on="on" />
      </template>
      <span>{{ lower_bound_count }} outlier{{(lower_bound_count!=1) ? 's': ''}}</span>
    </v-tooltip>
    <div :class="{'min-bar': lowerW!=0}" class="bar empty-bar default-bar"/>
    <v-tooltip transition="fade-transition" bottom content-class="bar-tooltip tooltip-above-dialog" color="success darken-2">
      <template v-slot:activator="{ on }">
        <div :class="{'min-bar': validW!=0}" :style="{'width': validW+'%'}" class="bar teal-bar" v-on="on" />
      </template>
      <span>{{ count_non_outliers }} not outlier{{(count_non_outliers!=1) ? 's': ''}}</span>
    </v-tooltip>
    <div :class="{'min-bar': upperW!=0}" class="bar empty-bar default-bar"/>
    <v-tooltip transition="fade-transition" bottom content-class="bar-tooltip tooltip-above-dialog" color="error darken-2">
      <template v-slot:activator="{ on }">
        <div :class="{'min-bar': upperW!=0}" :style="{'width': upperW+'%'}" class="bar red-bar" v-on="on" />
      </template>
      <span>{{ upper_bound_count }} outlier{{(upper_bound_count!=1) ? 's': ''}}</span>
    </v-tooltip>
  </div>
</template>

<script>
export default {

	props: {
		count_non_outliers: {
			default: 19,
			type: Number
		},
		lower_bound_count: {
			default: 4,
			type: Number
		},
		upper_bound_count: {
			default: 1,
			type: Number
    },
    lower_bound: 1,
    upper_bound: 1,
	},

  computed: {
    total () {
      return this.count_non_outliers + this.lower_bound_count + this.upper_bound_count
    },
    lowerW () {
      return (this.lower_bound_count / this.total) * 90
    },
    upperW () {
      return (this.upper_bound_count / this.total) * 90
    },
    validW () {
      return (this.count_non_outliers / this.total) * 80
    },
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
