<template>
  <div v-if="values.stddev!=undefined" class="component-container">
    <h3>Statistics</h3>
    <table class="details-table">
      <tbody>

        <tr>
          <td style="width:50%;">Standard deviation</td>
          <td style="width:50%;" :title="(+values.stddev)">{{ +(+values.stddev).toFixed(2) }}</td>
        </tr>

        <tr>
          <td style="width:50%;">Coef of variation</td>
          <td style="width:50%;" :title="(+values.coef_variation)">{{ +(+values.coef_variation).toFixed(2) }}</td>
        </tr>

        <tr>
          <td style="width:50%;">Kurtosis</td>
          <td style="width:50%;" :title="(+values.kurtosis)">{{ +(+values.kurtosis).toFixed(2) }}</td>
        </tr>

        <tr>
          <td style="width:50%;">Mean</td>
          <td style="width:50%;" :title="(+values.mean)">{{ +(+values.mean).toFixed(2) }}</td>
        </tr>

        <tr>
          <td style="width:50%;">MAD</td>
          <td style="width:50%;" :title="(+values.mad)">{{ +(+values.mad).toFixed(2) }}</td>
        </tr>

        <tr>
          <td style="width:50%;">Skewness</td>
          <td style="width:50%;" :title="(+values.skewness)">{{ +(+values.skewness).toFixed(2) }}</td>
        </tr>

        <tr>
          <td style="width:50%;">Sum</td>
          <td style="width:50%;" :title="(+values.variance)">{{ +(+values.variance).toFixed(2) }}</td>
        </tr>

        <tr>
          <td style="width:50%;">Variance</td>
          <td style="width:50%;" :title="(+values.range)">{{ +(+values.range).toFixed(2) }}</td>
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
		font-size: 13px !important;
	}
}
</style>
