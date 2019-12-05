<template>
  <div :class="{'table-graphic': table}" class="bb-graphic" @mouseleave="currentVal = false">
    <h3>Frequent values</h3>
    <BarsCanvas
      :values="values"
      :binMargin="1"
      :width="'auto'"
      :height="table ? 66 : 90"
      @hovered="setValueIndex($event)"
    />
    <div class="current-value" :title="currentValueString">{{ currentValueString }}</div>
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
			default: [],
			type: Array
		},
		total: {
			default: 1,
			type: Number
		},
		uniques: {
			default: 1,
			type: Number
		},
		table: {
			default: false,
			type: Boolean
    },
	},

	data () {
		return {
      currentVal: false,
      maxVal: 0,
		}
  },

  beforeMount() {
    this.maxVal = this.getMaxVal(this.values)
  },

	methods: {
		changeValue (newVal) {
			this.currentVal = newVal
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
    setValueIndex(index) {
      var item = this.values[index]
      if (item)
        this.currentVal = `${item.value}, ${item.count}, ${item.percentage}%`
    },
  },

  computed: {
    uniqueElements () {
      return Math.max(this.values.length, this.uniques)
    },
    currentValueString() {
      return (this.currentVal!==false) ? this.currentVal : `${(this.values.length!=this.uniqueElements) ? this.values.length+' of ' : '' }${this.uniqueElements} ${(this.uniqueElements===1) ? 'category' : 'categories'}`
    }
  }
}
</script>
