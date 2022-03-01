<template>
  <div v-if="valuesHasStats" class="component-container">
    <h3>Statistics</h3>
    <table class="details-table">
      <tbody>

        <tr v-for="key in statsKeys.filter(key => values[key] !== undefined)" :key="key">
          <td style="width:50%;">{{stats[key]}}</td>
          <td style="width:50%;" :title="(+values[key])">{{ +(+values[key]).toFixed(2) }}</td>
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
	},

  data () {
    return {
      stats: {
        'stddev': 'Standard deviation',
        'coef_variation': 'Coef of variation',
        'kurtosis': 'Kurtosis',
        'mean': 'Mean',
        'mad': 'MAD',
        'skewness': 'Skewness',
        'sum': "Sum",
        'variance': 'Variance',
        'range': 'Range'
      }
    }
  },

  computed: {
    statsKeys () {
      return Object.keys(this.stats);
    },

    valuesHasStats () {
      return this.statsKeys.some((key) => {
        return this.values[key] !== undefined;
      });
    }
  },
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
