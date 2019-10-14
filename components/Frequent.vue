<template>
  <div :class="{'table-graphic': table}" class="bb-graphic" @mouseleave="currentVal = false">
    <h3>Frequent values</h3>
    <div class="scroll-container">
      <div class="freq-container">
        <div
          v-for="(item, index) in values"
          :key="index"
          class="freq-bar"
          @mouseover="currentVal = `${item.value}, ${item.count}, ${item.percentage}%`"
        >
          <div v-if="item.count>0" :style="{'height': normVal(item.count)+'%'}" class="freq-value" />
        </div>
      </div>
    </div>
    <div class="current-value" :title="currentValueString">{{ currentValueString }}</div>
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
		uniques: {
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
			currentVal: false
		}
	},

	methods: {
		changeValue (newVal) {
			this.currentVal = newVal
		},
		normVal (val) {
			return (val * 100) / this.total
		}
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
