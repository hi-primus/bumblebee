<template>
  <div class="pbar">
    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <span v-on="on">
          <div :style="{'width': num2+'%'}" class="pb1" />
        </span>
      </template>
      <span>{{ goodVal }}, {{ num2 }}%</span>
    </v-tooltip>
    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <span v-on="on">
          <div :style="{'width': num1+'%'}" class="pb2" />
        </span>
      </template>
      <span>{{ data1 }}, {{ num1 }}%</span>
    </v-tooltip>
  </div>
</template>

<script>
export default {
	props: {
		data1: {
			default: 0,
			type: Number
		},
		total: {
			default: 0,
			type: Number
		}
	},

	data () {
		return {
			num1: 0,
			num2: 0,
			goodVal: 0
		}
	},

	beforeMount () {
		this.goodVal = this.total - this.data1
		this.num1 = ((this.data1 * 100) / this.total).toFixed(2)
		this.num2 = ((this.goodVal * 100) / this.total).toFixed(2)
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
	height: 5px;
	border-radius: 50px;
	width: 100%;
	overflow: overlay;
	&:hover {
		cursor: crosshair;
	}
}

.pb1 {
	background-color: #4db6ac;
	height: 5px;
	/*border-radius: 50px 0 0 50px;*/
	width: 50%;
	float: left;
}

.pb2 {
	background-color: #e57373;
	height: 5px;
	width: 25%;
	float: left;
	/*border-radius: 0 50px 50px 0;*/
}

.pb3 {
	background-color: lightgray;
	height: 8px;
	border-radius: 0 50px 50px 0;
	width: 25%;
	float: left;
}
</style>
