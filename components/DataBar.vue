<template>
  <div class="pbar">
    <v-tooltip content-class="bar-tooltip" color="success darken-2" :left="!bottom" :bottom="bottom">
      <template v-slot:activator="{ on }">
        <div v-on="on" :style="{'width': mismatchesP+'%'}" class="pb1" />
      </template>
      <span>{{ okValues }} valid values <span>{{ mismatchesP }}%</span></span>
    </v-tooltip>
    <v-tooltip content-class="bar-tooltip" color="error darken-2" :left="!bottom" :bottom="bottom">
      <template v-slot:activator="{ on }">
        <div v-on="on" :style="{'width': okP+'%'}" class="pb2" />
      </template>
      <span>{{ mismatches }} mismatched values <span>{{ okP }}%</span></span>
    </v-tooltip>
  </div>
</template>

<script>
export default {
	props: {
		mismatches: {
			default: 0,
			type: Number
		},
		total: {
			default: 0,
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
			mismatchesP: 0,
			okValues: 0
		}
	},

	beforeMount () {
		this.okValues = this.total - this.mismatches
		this.okP = ((this.mismatches * 100) / this.total).toFixed(2)
		this.mismatchesP = ((this.okValues * 100) / this.total).toFixed(2)
	}
}
</script>

<style lang="scss" scoped>
* {
	color: #fff !important;
}

// status bar
.pbar {
	background-color: lightgray;
	height: 8px;
	border-radius: 4px;
	width: 100%;
	overflow: overlay;
	&:hover {
		cursor: crosshair;
	}
}

.pb1 {
	background-color: $data-green;
	height: 100%;
	width: 50%;
	float: left;
}

.pb2 {
	background-color: $data-red;
	height: 100%;
	width: 25%;
	float: left;
}

.pb3 {
	background-color: lightgray;
	height: 8px;
	border-radius: 0 50px 50px 0;
	width: 25%;
	float: left;
}

.bar-tooltip {
  opacity: 1 !important;
  &>span>span {
    opacity: 0.8;
  }
}
</style>
