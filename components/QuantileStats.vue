<template>

  <div v-if="values.quantile!=undefined" class="component-container">

    <h3>Quantile statistics</h3>
    <v-simple-table class="table">
      <tbody>

        <tr>
          <td style="width:50%;">Minimum</td><td style="width:50%;">{{ values.min.toFixed(2) }}</td>
        </tr>

        <tr>
          <td style="width:50%;">5-th percentile</td><td style="width:50%;">{{ values.quantile['0.05'].toFixed(2) }}</td>
        </tr>

        <tr>
          <td style="width:50%;">Q1</td><td style="width:50%;">{{ values.quantile['0.25'].toFixed(2) }}</td>
        </tr>

        <tr>
          <td style="width:50%;">Median</td><td style="width:50%;">{{ values.quantile['0.5'].toFixed(2) }}</td>
        </tr>

        <tr>
          <td style="width:50%;">Q3</td><td style="width:50%;">{{ values.quantile['0.75'].toFixed(2) }}</td>
        </tr>

        <tr>
          <td style="width:50%;">95-th percentile</td><td style="width:50%;">{{ values.quantile['0.95'].toFixed(2) }}</td>
        </tr>

        <tr>
          <td style="width:50%;">Maximum</td><td style="width:50%;">{{ values.max.toFixed(2) }}</td>
        </tr>

        <tr>
          <td style="width:50%;">Range</td><td style="width:50%;">{{ values.range.toFixed(2) }}</td>
        </tr>
        <tr>
          <td class="level-right">Interquartile range</td><td style="width:50%;">{{ values.interquartile_range.toFixed(2) }}</td>
        </tr>

      </tbody>
    </v-simple-table>
  </div>

</template>

<script>
export default {

	props: {
		values: {
			default: { },
			type: Object
		}
	},
}
</script>

<style lang="scss" scoped>

  tr{
    border: none !important;
    td{
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
