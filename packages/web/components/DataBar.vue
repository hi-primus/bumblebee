<template>
  <div class="data-bar">
    <v-tooltip transition="tooltip-fade-transition" :left="!bottom" :bottom="bottom" content-class="bar-tooltip" color="dataprimary darken-2">
      <template v-slot:activator="{ on }">
        <div :class="{'min-bar': matchP!=0}" :style="{'width': matchP+'%'}" class="bar teal-bar" v-on="on" @click="$emit('clicked', 'ok')"/>
      </template>
      <span>{{ matchC | humanNumberInt }} match values <span class="percentage">{{ matchP }}%</span></span>
    </v-tooltip>
    <v-tooltip transition="tooltip-fade-transition" :left="!bottom" :bottom="bottom" content-class="bar-tooltip" color="error darken-2">
      <template v-slot:activator="{ on }">
        <div :class="{'min-bar': mismatchP!=0}" :style="{'width': mismatchP+'%'}" class="bar red-bar" v-on="on" @click="$emit('clicked', 'mismatch')" />
      </template>
      <span>{{ mismatch | humanNumberInt }} mismatch values <span class="percentage">{{ mismatchP }}%</span></span>
    </v-tooltip>
    <v-tooltip transition="tooltip-fade-transition" :left="!bottom" :bottom="bottom" content-class="bar-tooltip" background-color="#6c7680" color="#6c7680">
      <template v-slot:activator="{ on }">
        <div :class="{'min-bar': missingP!=0}" :style="{'width': missingP+'%'}" class="bar grey-bar" v-on="on" @click="$emit('clicked', 'missing')" />
      </template>
      <span>
        {{ missing | humanNumberInt }} missing values <span class="percentage">{{ missingP }}%</span><br/>
      </span>
    </v-tooltip>
    <div class="bar default-bar"/>
  </div>
</template>

<script>
export default {
	props: {
		missing: {
			default: 0,
			type: Number
		},
		match: {
			default: undefined,
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
		}
	},

  computed: {
    matchC () {
      return (this.match !== undefined) ? this.match : ( this.total - (this.missing + this.mismatch) )
    },
		matchP () {
      return +(+((this.matchC * 100) / this.total)).toFixed(2)
    },
    mismatchP () {
      return +(+((this.mismatch * 100) / this.total)).toFixed(2)
    },
    missingP () {
      return +(+((this.missing * 100) / this.total)).toFixed(2)
    }
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
