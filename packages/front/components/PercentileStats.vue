<template>

  <div v-if="values.percentile!=undefined" class="component-container">

    <h3>Percentile statistics</h3>
    <table class="details-table">
      <tbody>

        <tr>
          <td style="width:50%;">Minimum</td>
          <td style="width:50%;" :title="(+values.min)">{{ +(+values.min).toFixed(2) }}</td>
        </tr>

        <tr>
          <td style="width:50%;">5-th percentile</td>
          <td style="width:50%;" :title="(+values.percentile['0.05'])">{{ +(+values.percentile['0.05']).toFixed(2) }}</td>
        </tr>

        <tr>
          <td style="width:50%;">Q1</td>
          <td style="width:50%;" :title="(+values.percentile['0.25'])">{{ +(+values.percentile['0.25']).toFixed(2) }}</td>
        </tr>

        <tr>
          <td style="width:50%;">Median</td>
          <td style="width:50%;" :title="(+values.percentile['0.5'])">{{ +(+values.percentile['0.5']).toFixed(2) }}</td>
        </tr>

        <tr>
          <td style="width:50%;">Q3</td>
          <td style="width:50%;" :title="(+values.percentile['0.75'])">{{ +(+values.percentile['0.75']).toFixed(2) }}</td>
        </tr>

        <tr>
          <td style="width:50%;">95-th percentile</td>
          <td style="width:50%;" :title="(+values.percentile['0.95'])">{{ +(+values.percentile['0.95']).toFixed(2) }}</td>
        </tr>

        <tr>
          <td style="width:50%;">Maximum</td>
          <td style="width:50%;" :title="(+values.max)">{{ +(+values.max).toFixed(2) }}</td>
        </tr>

        <tr>
          <td style="width:50%;">Range</td>
          <td style="width:50%;" :title="(+values.range)">{{ +(+values.range).toFixed(2) }}</td>
        </tr>
        <tr>
          <td class="level-right">Interquartile range</td>
          <td style="width:50%;" :title="(+values.interquartile_range)">{{ +(+values.interquartile_range).toFixed(2) }}</td>
        </tr>

      </tbody>
    </table>
  </div>

</template>

<script>
export default {

	props: {
		values: {
			default: { },
			type: Object
		}
	}
}
</script>

<style lang="scss" scoped>

tr{
  border: none !important;
  td{
    font-size: 13px !important;
  }
}

</style>
