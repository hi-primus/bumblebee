<template>
  <div class="bb-graphic" :class="{'table-graphic': table}">
    <h3>Frequent values</h3>
    <div class="scroll-container">
      <div class="freq-container">
        <div
          v-for="(item, index) in values"
          :key="index"
          class="freq-bar"
          @mouseover="changeValue(`${item.value}, ${item.percentage}%`)"
        >
          <div :style="{'height': normVal(item.count)+'%'}" class="freq-value" />
        </div>
      </div>
    </div>
    <div class="current-value">{{ currentVal }}</div>
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
    table: {
      default: false,
      type: Boolean
    }
	},

	data () {
		return {
			sortedData: [],
			currentVal: '',
			barNum: 0
		}
	},

	beforeMount () {
		this.changeValue(`${this.values[0].count}, ${this.values[0].percentage}%`)

		this.barNum = this.values.length
	},

	methods: {
		changeValue (newVal) {
			this.currentVal = newVal
		},
		normVal (val) {
			return (val * 100) / this.total
		}
	}
}
</script>
