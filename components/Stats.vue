<template>
  <div>

    <div class="component-container">
      <h3>STATISTICS</h3>
      <table class="table">
        <tbody>

          <tr v-if="values.p_uniques!=undefined">
            <td style="width:50%;">Unique (%)</td><td style="width:50%;">{{values.p_uniques.toFixed(2)}}</td>
          </tr>

          <tr v-if="values.uniques_count!=undefined">
            <td style="width:50%;">Distinct count</td><td style="width:50%;">{{values.uniques_count.toFixed(2)}}</td>
          </tr>

          <tr v-if="values.missing_count!=undefined">
            <td style="width:50%;">Missing (%)</td><td style="width:50%;">{{values.missing_count.toFixed(2)}}</td>
          </tr>

          <tr v-if="values.p_missing!=undefined">
            <td style="width:50%;">Missing (n)</td><td style="width:50%;">{{values.p_missing.toFixed(2)}}</td>
          </tr>

          <tr v-if="values.mean!=undefined">
            <td style="width:50%;">Mean</td><td style="width:50%;">{{values.mean.toFixed(2)}}</td>
          </tr>

          <tr v-if="values.min!=undefined">
            <td style="width:50%;">Minimum</td><td style="width:50%;">{{values.min.toFixed(2)}}</td>
          </tr>

          <tr v-if="values.max!=undefined">
            <td style="width:50%;">Maximum</td><td style="width:50%;">{{values.max.toFixed(2)}}</td>
          </tr>

          <tr v-if="values.zeros!=undefined">
            <td style="width:50%;">Zeros</td><td style="width:50%;">{{values.zeros.toFixed(2)}}</td>
          </tr>

        </tbody>
      </table>
    </div>

    <div class="component-container" v-if="values.quantile!=undefined">

      <h3>Quantile statistics</h3>
        <table class="table">
          <tbody>

            <tr>
              <td style="width:50%;">Minimum</td><td style="width:50%;">{{values.min.toFixed(2)}}</td>
            </tr>

            <tr>
              <td style="width:50%;">5-th percentile</td><td style="width:50%;">{{values.quantile['0.05'].toFixed(2)}}</td>
            </tr>

            <tr>
              <td style="width:50%;">Q1</td><td style="width:50%;">{{values.quantile['0.25'].toFixed(2)}}</td>
            </tr>

            <tr>
              <td style="width:50%;">Median</td><td style="width:50%;">{{values.quantile['0.5'].toFixed(2)}}</td>
            </tr>

            <tr>
              <td style="width:50%;">Q3</td><td style="width:50%;">{{values.quantile['0.75'].toFixed(2)}}</td>
            </tr>

            <tr>
              <td style="width:50%;">95-th percentile</td><td style="width:50%;">{{values.quantile['0.95'].toFixed(2)}}</td>
            </tr>

            <tr>
              <td style="width:50%;">Maximum</td><td style="width:50%;">{{values.max.toFixed(2)}}</td>
            </tr>

            <tr>
              <td style="width:50%;">Range</td><td style="width:50%;">{{ values.range.toFixed(2) }}</td>
            </tr>
            <tr>
              <td class="level-right">Interquartile range</td><td style="width:50%;">{{ values.interquartile_range.toFixed(2) }}</td>
            </tr>

          </tbody>
        </table>
    </div>

    <div class="component-container" v-if="values.stddev!=undefined">

    <h3>Descriptive statistics</h3>
        <table class="table">
          <tbody>

            <tr>
              <td style="width:50%;">Standard deviation</td><td style="width:50%;">{{values.stddev.toFixed(2)}}</td>
            </tr>

            <tr>
              <td style="width:50%;">Coef of variation</td><td style="width:50%;">{{values.coef_variation.toFixed(2)}}</td>
            </tr>

            <tr>
              <td style="width:50%;">Kurtosis</td><td style="width:50%;">{{values.kurtosis.toFixed(2)}}</td>
            </tr>

            <tr>
              <td style="width:50%;">Mean</td><td style="width:50%;">{{values.mean.toFixed(2)}}</td>
            </tr>

            <tr>
              <td style="width:50%;">MAD</td><td style="width:50%;">{{values.mad.toFixed(2)}}</td>
            </tr>

            <tr>
              <td style="width:50%;">Skewness</td><td style="width:50%;">{{values.skewness.toFixed(2)}}</td>
            </tr>

            <tr>
              <td style="width:50%;">Sum</td><td style="width:50%;">{{values.variance.toFixed(2)}}</td>
            </tr>

            <tr>
              <td style="width:50%;">Variance</td><td style="width:50%;">{{ values.range.toFixed(2) }}</td>
            </tr>


          </tbody>
        </table>

      </div>
    </div>




</template>

<script>
  export default {

    props: ['values'],

    data() {
      return {
        arrDataset: []
      }
    },


  }
</script>

<style lang="scss" scoped>

  .no-line {
    td {
      border: none !important;
    }
  }

</style>
