<template>
  <div :class="{'table-graphic': table}" class="bb-graphic">
    <h3>{{ title }}</h3>
    <div class="scroll-container" @mouseleave="nowValues = false">
      <div class="freq-container">
        <div
          v-for="(item, index) in values"
          :key="index"
          class="freq-bar"
          @mouseover="changeValue((+item.lower).toFixed(2),(+item.upper).toFixed(2), item.count)"
        >
          <div :style="{'height': normVal(item.count)+'%'}" class="freq-value" />
        </div>
      </div>
    </div>
    <div v-if="nowValues!==false" class="current-value">{{ bottomVal | humanNumber }} - {{ topVal | humanNumber }}, {{ nowValues }}</div>
    <div v-else class="current-value">{{ defaultBottom | humanNumber }} - {{ defaultTop | humanNumber }}</div>
  </div>
</template>

<script>
export default {
	props: {
		values: {
			default: () => ([]),
			type: Array
		},
		total: {
			default: 1,
			type: Number
		},
		title: {
			default: '',
			type: String
		},
		table: {
			default: false,
			type: Boolean
		}
	},

	data () {
		return {
			maxVal: 0,
			bottomVal: 0,
			topVal: 0,
			nowValues: false,
			defaultBottom: '',
			defaultTop: ''
		}
	},

	beforeMount () {
		this.maxVal = this.getMaxVal(this.values)
		this.defaultBottom = `${(+this.values[0].lower).toFixed(2)}`
		this.defaultTop = `${(+this.values[this.values.length - 1].upper).toFixed(2)}`
		this.changeValue(
			(+this.values[0].lower).toFixed(2), // nh
			(+this.values[0].upper).toFixed(2),
			this.values[0].count
		)
	},

	methods: {
		changeValue (minVal, topVal, count) {
			this.bottomVal = minVal
			this.topVal = topVal
			this.nowValues = `${count}, ${+(count/this.total).toFixed(2)}%`
		},

		getMaxVal (arr) {
			return arr.reduce(
				(max, p) => (p.count > max ? p.count : max),
				arr[0].count
			)
		},

		normVal (val) {
			return (val * 100) / this.maxVal
		}
	}
}
</script>
