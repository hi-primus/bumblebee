<template>
  <div v-if="showValues" class="component-container">
    <h3>Statistics</h3>
    <div style="min-height: 128px;" class="vertical-center">
      <div
        v-if="values === 'loading' || !values"
        class="mx-auto d-flex"
      >
        Loading stats
      </div>
      <div
        v-else-if="values === 'error'"
        @click="getStats"
        class="mx-auto d-flex"
      >
        Error loading stats
      </div>
      <template v-else>
        <table class="details-table">
          <tbody>
            <tr v-for="key in statsKeys.filter(key => values[key] !== undefined)" :key="key">
              <td style="width:50%;">{{stats[key]}}</td>
              <td style="width:50%;" :title="(+values[key])">{{ +(+values[key]).toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>
      </template>
    </div>
  </div>
</template>

<script>
export default {
	props: {
		values: {
			default: {},
		}
	},

  data () {
    return {
      stats: {
        'count': 'Count',
        'mean': 'Mean',
        'std': 'Standard deviation',
        'min': 'Min value',
        'max': 'Max value',
        '25%': 'First quartile (25%)',
        '50%': 'Second quartile (median)',
        '75%': 'Third quartile (75%)',
      }
    }
  },

  computed: {
    statsKeys () {
      return Object.keys(this.stats);
    },

    showValues () {

      if (this.values === 'loading') {
        return true;
      }

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
