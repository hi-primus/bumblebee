<template>
  <div class="top-values">
    <div
      v-for="(item, index) in slice ? values.slice(0,slice) : values"
      :key="index"
      class="top-values-item"
    >
      <div :style="{'width': normVal(item.count)+'%' }" :title="item.value" class="item-bar">
      </div>
      <div class="item-value" :title="item.value">
        <span>
          {{ item.value | varCheck }}
        </span>
      </div>
      <div class="item-count" :title="item.count | varCheck">
        <span>{{ item.count | varCheck }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
	props: {
		values: {
			type: Array,
			default: [1]
		},
		total: {
			type: Number,
			default: 1
    },
    slice: {
      type: Number,
      default: 0
    }
	},

	data () {
		return {}
	},

	methods: {
		normVal (val) {
			return (val * 100) / this.total
		}
	}
}
</script>

<style lang="scss" scoped>

tr {
	border-bottom: 0 solid transparent !important;
	th {
		color: rgba(0, 0, 0, 1) !important;
		border-bottom: 0 solid transparent !important;
	}
	td {
		height: 15px !important;
    font-size: 13px !important;
    &:first-child {
      padding-left: 0 !important;
    }
	}
}
</style>
