<template>
  <div class="bb-graphic" :class="{'table-graphic': table}">
    <h3>{{ title }}</h3>
    <div class="scroll-container">
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
    <div class="current-value">{{ topVal | formatNumber }} - {{ minVal | formatNumber }}, {{ nowCount }}</div>
  </div>
</template>

<script>
export default {
	props: {
		values: {
			default: [],
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
			sortedData: [],
			currentVal: '',
			maxVal: 0,
			topVal: 0,
			minVal: 0,
			nowCount: 0,
			barNum: 0
		}
	},

	beforeMount () {
		this.maxVal = this.getMaxVal(this.values)
		this.changeValue(
			(+this.values[0].lower).toFixed(2), //nh
			(+this.values[0].upper).toFixed(2),
			this.values[0].count
		)

		this.barNum = this.values.length
	},

	methods: {
		changeValue (minVal, maxVal, count) {
			this.topVal = minVal
			this.minVal = maxVal
			this.nowCount = count
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
