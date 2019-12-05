<template>
  <div :class="{'table-graphic': table}" class="bb-graphic" @mouseleave="currentCount = false">
    <h3>{{ title }}</h3>
    <BarsCanvas
      :values="values"
      :maxVal="maxVal"
      :binMargin="1"
      :width="'auto'"
      :height="table ? 66 : 90"
      @hovered="setValueIndex($event)"
    />
    <div v-if="currentValueString" :title="currentValueString" class="current-value">{{ currentValueString }}</div>
  </div>
</template>

<script>
import BarsCanvas from '@/components/BarsCanvas'

export default {

  components: {
    BarsCanvas
  },

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
    },
		selectable: {
			default: false,
			type: Boolean
    },
    barColor: {
      default: 'success',
      type: String
    },
	},

	data () {
		return {
			maxVal: 0,
			currentLower: 0,
			currentUpper: 0,
			currentCount: false,
			lower: '',
      selected: {},
      upper: '',
		}
  },

  computed: {

    currentValueString () {
      if (this.currentCount)
        return this.$options.filters.humanNumber(this.currentLower) + ' - ' + this.$options.filters.humanNumber(this.currentUpper) + ', ' + this.currentCount
      else
        return this.$options.filters.humanNumber(this.lower) + ' - ' + this.$options.filters.humanNumber(this.upper)
    }
  },

	beforeMount () {
		this.maxVal = this.getMaxVal(this.values)
		this.lower = (+this.values[0].lower).toFixed(2)
		this.upper = (+this.values[this.values.length-1].upper).toFixed(2)
  },

	methods: {
    clicked (index) {
      if (this.values[index].count)
        this.$set(this.selected, index, !this.selected[index]);
        this.$emit('clicked',this.values[index])
    },

    setValueIndex(index) {
      var item = this.values[index]
      if (item)
        this.setValue((+item.lower).toFixed(2),(+item.upper).toFixed(2), item.count)
    },

		setValue (lower, upper, count) {
			this.currentLower = lower
			this.currentUpper = upper
			this.currentCount = `${count}, ${+(count/this.total).toFixed(2)}%`
		},

		getMaxVal (arr) {
			return arr.reduce(
				(max, p) => (p.count > max ? p.count : max),
				arr[0].count
			)
		},

		normVal (val) {
			return (val * 100) / this.maxVal
    },

	}
}
</script>
