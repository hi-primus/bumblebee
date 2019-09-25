<template>
  <div class="component-container">
    <h3>General</h3>
    <table class="details-table">
      <tbody>
        <tr v-if="values.count_uniques!==null && values.count_uniques!==undefined">
          <td style="width:45%;">Uniques</td>
          <td style="width:100%; text-align: right;">{{ (+values.count_uniques)}}</td>
          <td style="width:10%; opacity: 0.71;" :title="pUniques.toFixed(2)">{{ pUniques.toFixed(2) }}%</td>
        </tr>

        <tr v-if="values.count_na!==null && values.count_na!==undefined">
          <td style="width:45%;">Missing</td>
          <td style="width:100%; text-align: right;">{{ (+values.count_na) }}</td>
          <td style="width:10%; opacity: 0.71;" :title="pNA.toFixed(2)">{{ pNA.toFixed(2) }}%</td>
        </tr>

        <tr v-if="values.zeros!==null && values.zeros!==undefined">
          <td style="width:45%;">Zeros</td>
          <td style="width:100%; text-align: right;" :title="(+values.zeros)">{{ (+values.zeros) }}</td>
          <td style="width:10%; opacity: 0.71;" :title="pZeros.toFixed(2)"> {{pZeros.toFixed(2)}}% </td>
        </tr>

        <tr v-if="dtypes.null!==null && dtypes.null!==undefined">
          <td style="width:45%;">Null values</td>
          <td style="width:100%; text-align: right;" :title="(+dtypes.null)">{{ (+dtypes.null) }}</td>
          <td style="width:10%; opacity: 0.71;" :title="pNull.toFixed(2)"> {{pNull.toFixed(2)}}% </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
	props: {
		values: {
			default: ()=>({}),
			type: Object
    },
    dtypes: {
      default: ()=>({}),
      type: Object
    },
    rowsCount: {
      type: Number
    }
  },

  computed: {
    pNA () {
      return (this.values.count_na / this.rowsCount)*100
    },
    pUniques () {
      return (this.values.count_uniques / this.rowsCount)*100
    },
    pZeros () {
      return (this.values.zeros / this.rowsCount)*100
    },
    pNull () {
      return (this.dtypes.null / this.rowsCount)*100
    },
  }
}
</script>

<style lang="scss" scoped>
tr {
	border: none !important;
	td {
		font-size: 13px !important;
	}
}
</style>
