<template>
  <span v-if="typeof value !== 'object' || value === null">{{value}}</span>
  <div v-else class="graphic-ht-container">
    <DataBar
      class="table-data-bar"
      bottom
      :missing="value.missing"
      :total="+value.total"
    />
    <Frequent   class="histfreq" v-if="value.frequency" table :values="value.frequency" :total="+value.frequency[0].count" />
    <Histogram  class="histfreq" v-else-if="value.hist" table :values="value.hist" :total="10" />
    <Histogram  class="histfreq" v-else-if="value.hist_years" table :values="value.hist_years" :total="10" />
  </div>
</template>

<script>

import Histogram from "@/components/Histogram";
import Frequent from "@/components/Frequent";
import DataBar from "@/components/DataBar";

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
	},
}

</script>

<style lang="scss">
  .graphic-ht-container {
    height: 90px;
    display: flex;
    flex-direction: column;

    margin: 0 -4px 2px -4px;
    .table-data-bar {
      margin-bottom: 2px;
      position: relative;
      border-radius: 0;
      width: 100%;
    }

    .histfreq {
      flex: 1;
    }
  }
</style>
