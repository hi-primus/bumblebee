<template>
  <div class="component-container">
    <h3>General</h3>
    <table class="details-table">
      <tbody>
        <tr class="nohighlight">
          <td style="width: 100%;" colspan="3">
            <DataBar
              :missing="+values.missing"
              :total="rowsCount"
              :mismatch="values.mismatch"
              :match="values.match"
              :nullV="values.null"
              @clicked="$emit('barClicked', $event)"
              bottom
              class="rounded"
            />
          </td>
        </tr>
        <tr v-if="values.count_uniques!==null && values.count_uniques!==undefined">
          <td style="width:45%;">Uniques</td>
          <td style="width:100%; text-align: right;" :title="(+values.count_uniques)">{{ (+values.count_uniques) }}</td>
          <td style="width:10%; opacity: 0;" :title="+pUniques+'%'">{{ +pUniques.toFixed(2) }}%</td>
        </tr>

        <tr v-if="values.match!==null && values.match!==undefined">
          <td style="width:45%;">Match</td>
          <td style="width:100%; text-align: right;" :title="(+values.match)">{{ (+values.match) }}</td>
          <td style="width:10%; opacity: 0.71;" :title="+pMatch+'%'">{{ +pMatch.toFixed(2) }}%</td>
        </tr>

        <tr v-if="values.missing!==null && values.missing!==undefined">
          <td style="width:45%;">Missing</td>
          <td style="width:100%; text-align: right;" :title="(+values.missing)">{{ (+values.missing) }}</td>
          <td style="width:10%; opacity: 0.71;" :title="+pMissing+'%'">{{ +pMissing.toFixed(2) }}%</td>
        </tr>

        <tr v-if="values.zeros!==null && values.zeros!==undefined">
          <td style="width:45%;">Zeros</td>
          <td style="width:100%; text-align: right;" :title="(+values.zeros)">{{ (+values.zeros) }}</td>
          <td style="width:10%; opacity: 0.71;" :title="+pZeros+'%'"> {{ +pZeros.toFixed(2) }}% </td>
        </tr>

        <tr v-if="values.null!==null && values.null!==undefined">
          <td style="width:45%;">Null values</td>
          <td style="width:100%; text-align: right;" :title="(+values.null)">{{ (+values.null) }}</td>
          <td style="width:10%; opacity: 0.71;" :title="+pNull+'%'"> {{ +pNull.toFixed(2) }}% </td>
        </tr>

        <tr>
          <td style="width:45%;">Mismatches</td>
          <td style="width:100%; text-align: right;" :title="(+values.mismatch || 0)">{{ (+values.mismatch || 0) }}</td>
          <td style="width:10%; opacity: 0.71;" :title="+pMismatch+'%'"> {{ +pMismatch.toFixed(2) }}% </td>
        </tr>
        <tr v-if="values.inferred_data_type && values.inferred_data_type.format">
          <td style="width:45%;">Date format</td>
          <td colspan="2" style="width:100%; text-align: right;" :title="(values.inferred_data_type.format)">
          <span class="font-mono">{{ (values.inferred_data_type.format) }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>

import DataBar from '@/components/DataBar'

export default {

  components: {
		DataBar
  },

	props: {
    values: {
      default: ()=>({}),
      type: Object
    },
    rowsCount: {
      type: Number
    }
  },

  computed: {
    pMissing () {
      return ((this.values.missing || 0) / this.rowsCount)*100
    },
    pNull () {
      return ((this.values.null || 0) / this.rowsCount)*100
    },
    pUniques () {
      return ((this.values.count_uniques || 0) / this.rowsCount)*100
    },
    pMatch () {
      return ((this.values.match || 0) / this.rowsCount)*100
    },
    pZeros () {
      return ((this.values.zeros || 0) / this.rowsCount)*100
    },
    pMismatch () {
      return ((this.values.mismatch || 0) / this.rowsCount)*100
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
