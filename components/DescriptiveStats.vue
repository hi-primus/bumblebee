<template>
  <div v-if="values.stddev!=undefined" class="component-container">
    <h3>Descriptive statistics</h3>
    <v-simple-table class="table">
      <tbody>
        <tr>
          <td style="width:50%;">Standard deviation</td>
          <td style="width:50%;">{{ (+values.stddev).toFixed(2) }}</td>
        </tr>

        <tr>
          <td style="width:50%;">Coef of variation</td>
          <td style="width:50%;">{{ (+values.coef_variation).toFixed(2) }}</td>
        </tr>

        <tr>
          <td style="width:50%;">Kurtosis</td>
          <td style="width:50%;">{{ (+values.kurtosis).toFixed(2) }}</td>
        </tr>

        <tr>
          <td style="width:50%;">Mean</td>
          <td style="width:50%;">{{ (+values.mean).toFixed(2) }}</td>
        </tr>

        <tr>
          <td style="width:50%;">MAD</td>
          <td style="width:50%;">{{ (+values.mad).toFixed(2) }}</td>
        </tr>

        <tr>
          <td style="width:50%;">Skewness</td>
          <td style="width:50%;">{{ (+values.skewness).toFixed(2) }}</td>
        </tr>

        <tr>
          <td style="width:50%;">Sum</td>
          <td style="width:50%;">{{ (+values.variance).toFixed(2) }}</td>
        </tr>

        <tr>
          <td style="width:50%;">Variance</td>
          <td style="width:50%;">{{ (+values.range).toFixed(2) }}</td>
        </tr>
      </tbody>
    </v-simple-table>
  </div>
</template>

<script>
export default {
	props: {
		values: {
			default: {},
			type: Object
		}
	},
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
