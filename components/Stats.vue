<template>
  <div class="component-container">
    <h3>STATISTICS</h3>
    <table class="details-table">
      <tbody>
        <tr v-if="values.p_uniques!==null && values.p_uniques!==undefined">
          <td style="width:50%;">Unique</td>
          <td style="width:50%;">{{ (+values.uniques_count).toFixed(2) }}</td>
          <td>{{ (+values.p_uniques).toFixed(2) }}%</td>
        </tr>

        <tr v-if="values.p_count_na!==null && values.p_count_na!==undefined">
          <td style="width:50%;">Missing</td>
          <td style="width:50%;">{{ (+values.p_count_na).toFixed(2) }}</td>
          <td>{{ (+values.p_count_na).toFixed(2) }}%</td>
        </tr>

        <tr v-if="values.mean!==null && values.mean!==undefined">
          <td style="width:50%;">Mean</td>
          <td colspan="2" style="width:50%;">{{ (+values.mean).toFixed(2) }}</td>
        </tr>

        <tr v-if="values.min!==null && values.min!==undefined">
          <td style="width:50%;">Minimum</td>
          <td colspan="2" style="width:50%;">{{ values.min }}</td>
        </tr>

        <tr v-if="values.max!==null && values.max!==undefined">
          <td style="width:50%;">Maximum</td>
          <td colspan="2" style="width:50%;">{{ values.max }}</td>
        </tr>

        <tr v-if="values.zeros!==null && values.zeros!==undefined">
          <td style="width:50%;">Zeros</td>
          <td colspan="2" style="width:50%;">{{ (+values.zeros).toFixed(2) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
	props: {
		values: {
			default: {},
			type: Object
		}
	}
}
</script>

<style lang="scss" scoped>
tr {
	border: none !important;
	td {
		height: 15px !important;
		font-size: 11px !important;
	}
}

.no-line {
	td {
		border: none !important;
	}
}
</style>
