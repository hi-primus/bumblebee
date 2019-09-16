<template>
  <v-hover>
    <div :class="{'table-graphic': table}" class="bb-graphic">
      <h3>Frequent values</h3>
      <div class="scroll-container" @mouseout="currentVal = false">
        <div class="freq-container">
          <div
            v-for="(item, index) in values"
            :key="index"
            class="freq-bar"
            @mouseover="currentVal = `${item.value}, ${item.percentage}%`"
          >
            <div :style="{'height': normVal(item.count)+'%'}" class="freq-value" />
          </div>
        </div>
      </div>
      <div class="current-value">{{ (currentVal!==false) ? currentVal : `${(values.length!=uniques) ? values.length+' of ' : '' }${uniques} categories` }}</div>
    </div>
  </v-hover>
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
	}
}
</script>
