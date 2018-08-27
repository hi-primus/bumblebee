<template>
  
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
              <td style="width:50%;">Minimum</td><td style="width:50%;">{{values.min}}</td>
            </tr>

            <tr v-if="values.max!=undefined">
              <td style="width:50%;">Maximum</td><td style="width:50%;">{{values.max}}</td>
            </tr>

            <tr v-if="values.zeros!=undefined">
              <td style="width:50%;">Zeros</td><td style="width:50%;">{{values.zeros.toFixed(2)}}</td>
            </tr>

          </tbody>
        </table>
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
