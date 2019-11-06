<template>
  <span v-if="typeof value !== 'object' || value === null" :title="value">
    <template v-if="value!==null && value!==undefined">
      &nbsp;{{ value }}&nbsp;
    </template>
  </span>
  <div v-else class="graphic-ht-container">
    <DataBar
      :missing="value.missing"
      :total="+value.total"
      :mismatch="+value.mismatch"
      :nullV="+value.null"
      class="table-data-bar"
      bottom
    />
    <Frequent
      v-if="value.frequency"
      :uniques="value.count_uniques"
      :values="value.frequency"
      :total="+value.frequency[0].count"
      class="histfreq"
      table
    />
    <Histogram
      v-else-if="value.hist"
      :uniques="value.count_uniques"
      :values="value.hist"
      :total="+value.total"
      class="histfreq"
      table
    />
    <Histogram
      v-else-if="value.hist_years"
      :uniques="value.count_uniques"
      :values="value.hist_years"
      :total="+value.total"
      class="histfreq"
      table
    />
  </div>
</template>

<script>

import Histogram from '@/components/Histogram'
import Frequent from '@/components/Frequent'
import DataBar from '@/components/DataBar'

export default {

	components: {
		Histogram,
		Frequent,
		DataBar
	},

	props: {
		// hotInstance: null,
		// row: null,
		// col: null,
		// value: 0
	}
}

</script>

<style lang="scss">
  .graphic-ht-container {
    height: 90px;
    display: flex;
    flex-direction: column;
    margin: 0 -4px 2px -4px;

    position: relative;

    .table-data-bar {
      margin-bottom: 2px;
      position: relative;
      border-radius: 0;
      width: 100%;
    }

    .histfreq {
      flex: 1;
    }
    // .data-type-header {
    //   pointer-events: none;
    //   position: absolute;
    //   top: -25px;
    //   left: 4px;
    //   z-index: 103;
    // }
  }
</style>
