<template>
  <div>
    <h3>Top values</h3>
    <table class="details-table">
      <tbody>
        <tr v-for="(item, index) in values.slice(0,10)" :key="index">
          <td class="top-bar" style="width:80%;">
            <div :style="{'width': normVal(item.count)+'%' }" :title="item.value" class="bar">
            </div>
            <div class="value">{{ item.value | varCheck }}</div>
          </td>
          <td style="width:20%;" :title="item.count | varCheck">{{ item.count | varCheck }}</td>
        </tr>
      </tbody>
    </table>
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
