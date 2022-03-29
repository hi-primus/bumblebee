<template>
  <div class="bb-graphic"  v-if="values.length" @mouseleave="currentCount = false">
    <div :style="{'min-height': 60+'px'}">
      <BarsCanvas
        :selectable="selectable"
        :values="values"
        :maxVal="maxVal"
        :binMargin="1"
        :width="'auto'"
        :height="height"
        :selected="computedSelected"
        @update:selected="updateSelected"
        @hovered="setValueIndex($event)"
      />
    </div>
    <div v-if="currentValueString" :title="currentValueString" class="current-value">{{ currentValueString }}</div>
  </div>
</template>

<script>
import BarsCanvas from '@/components/BarsCanvas'
import { mapState, mapGetters } from 'vuex'

import { reduceRanges, arraysEqual } from 'bumblebee-utils'

export default {

  components: {
    BarsCanvas
  },

  props: {
    values: {
      default: () => ([]),
      type: Array
    },
    total: {
      default: 1,
      type: Number
    },
    height: {
      default: 60,
      type: Number
    },
    columnIndex: {
      default: -1,
      type: Number
    },
    selectable: {
      default: false,
      type: Boolean
    },
  },

  data () {
    return {
      maxVal: 0,
      currentLower: 0,
      currentUpper: 0,
      currentCount: false,
      lower: '',
    upper: ''
    }
  },

  computed: {

    ...mapGetters(['currentSelection']),
    ...mapState(['tab']),

    currentValueString () {
      if (this.currentCount)
        return this.$options.filters.humanNumber(this.currentLower) + ' - ' + this.$options.filters.humanNumber(this.currentUpper) + ', ' + this.currentCount
      else
        return this.$options.filters.humanNumber(this.lower) + ' - ' + this.$options.filters.humanNumber(this.upper)
    },

    computedSelected () {
      let ds = this.currentSelection;

      if (ds && ds.ranged && ds.ranged.index == this.columnIndex) {
        return ds.ranged.indices;
      } else {
        return [];
      }
    }
  },

  created () {
    this.updateValues();
  },

  watch: {
    values: 'updateValues'
  },

  methods: {

    updateValues () {
      this.maxVal = this.getMaxVal(this.values)
      this.lower = (+this.values[0].lower).toFixed(2)
      this.upper = (+this.values[this.values.length-1].upper).toFixed(2)
    },

    updateSelected (v) {

      v = v || [];

      if (arraysEqual(this.computedSelected, v)) {
        return;
      }
      
      var { index, ranges } = this.currentSelection.ranged || {}

      ranges = ranges || []
      index = index || -1

      if (v.length > 0 || index == this.columnIndex) {
        var newRanges = reduceRanges( v.map(index=>[this.values[index].lower, this.values[index].upper]) )
        if (!arraysEqual(ranges, newRanges) || index != this.columnIndex) {
          this.$store.commit('selection',{
            ranged: {
              index: v.length ? this.columnIndex : -1,
              ranges: newRanges,
              indices: v
            }
          });
        }
      }
    },

    setValueIndex(index) {
      var item = this.values[index]
      if (item)
        this.setValue((+item.lower).toFixed(2),(+item.upper).toFixed(2), item.count)
    },

    setValue (lower, upper, count) {
      this.currentLower = lower
      this.currentUpper = upper
      this.currentCount = `${count}, ${+((count/this.total)*100).toFixed(2)}%`
    },

    getMaxVal (arr) {
      return arr.reduce(
        (max, p) => (p.count > max ? p.count : max),
        arr[0].count
      )
    },

    normVal (val) {
      return (val * 100) / this.maxVal
    },

  }
}
</script>
