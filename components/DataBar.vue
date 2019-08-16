<template>
  <div class="data-bar">
    <v-tooltip content-class="bar-tooltip" color="success darken-2" :left="!bottom" :bottom="bottom">
      <template v-slot:activator="{ on }">
        <div v-on="on" :class="{'data-bar-min': okP!=0}" :style="{'width': okP+'%'}" class="data-bar-green" />
      </template>
      <span>{{ okValues }} valid values <span>{{ okP }}%</span></span>
    </v-tooltip>
    <v-tooltip content-class="bar-tooltip" color="error darken-2" :left="!bottom" :bottom="bottom">
      <template v-slot:activator="{ on }">
        <div v-on="on" :class="{'data-bar-min': mismatchesP!=0}" class="data-bar-red" />
      </template>
      <span>{{ mismatches }} mismatched values <span>{{ mismatchesP }}%</span></span>
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
		this.mismatchesP = ((this.mismatches * 100) / this.total).toFixed(2)
		this.okP = 100 - this.mismatchesP;
	}
}
</script>

<style lang="scss" scoped>
* {
	color: #fff !important;
}

// status bar
.data-bar {
	background-color: lightgray;
	height: 8px;
	border-radius: 4px;
	width: 100%;
  overflow: overlay;
  display: flex;

  &:hover {
		cursor: crosshair;
  }

  .data-bar-green {
    background-color: $data-green;
    height: 100%;
    width: 0;
    float: left;
  }

  .data-bar-red {
    background-color: $data-red;
    height: 100%;
    width: 0;
    float: left;
  }

  .data-bar-min {
    min-width: 4px;
  }
}


.bar-tooltip {
  opacity: 1 !important;
  &>span>span {
    opacity: 0.8;
  }
}
</style>
