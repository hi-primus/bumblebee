<template>
  <div class="bb-graphic" v-if="calculatedValues.length" @mouseleave="currentVal = false">

    <div :style="{'min-height': 60+'px'}">
      <BarsCanvas
        :selectable="selectable"
        :values="calculatedValues"
        :binMargin="1"
        :width="'auto'"
        :height="height"
        :selected="computedSelected"
        @update:selected="updateSelected"
        @hovered="setValueIndex($event)"
      />
    </div>
    <div v-if="!currentVal" class="current-value" :title="elementsString">{{ elementsString }}</div>
    <div v-else class="current-value font-table" :title="currentVal" v-html="currentVal"></div>
  </div>
</template>

<script>
import BarsCanvas from '@/components/BarsCanvas'
import { mapState, mapGetters } from 'vuex'
import { arraysEqual } from 'bumblebee-utils'

export default {

  components: {
    BarsCanvas
  },
  props: {
    values: {
      default: ()=>[],
      type: [Array, Object]
    },
    count: {
      default: ()=>[],
      type: Array
    },
    total: {
      default: 1,
      type: Number
    },
    uniques: {
      default: 1,
      type: Number
    },
    height: {
      default: 60,
      type: Number
    },
    columnIndex: {
      default: -1
    },
    selectable: {
      default: false,
      type: Boolean
    },
  },

  data () {
    return {
      currentVal: false,
      maxVal: 0
    }
  },

  created() {
    this.maxVal = (this.calculatedValues.length) ? this.getMaxVal(this.calculatedValues) : 1
  },

  computed: {

    ...mapGetters(['currentSelection']),
    ...mapState(['tab']),

    cValues () {
      
    },

    computedSelected () {
      let ds = this.currentSelection;

      if (ds && ds.ranged && ds.ranged.index == this.columnIndex) {
        return ds.ranged.indices;
      } else {
        return [];
      }
    },

    calculatedValues() {
      let frequentValues;
      if (Array.isArray(this.values)) {
        frequentValues = this.values;
      }
      if (Array.isArray(this.values.values)) {
        frequentValues = this.values.values;
      }
      if (!frequentValues) {
        console.warn("Frequent values not set", this.columnIndex, this.values);
        return [];
      }
      return frequentValues.map((e,i)=>{
        return {
          value: e.value,
          count: e.count,
          percentage: +((e.count/this.total)*100).toFixed(2)
        }
      })
    },

    uniqueElements () {
      return Math.max(this.calculatedValues.length, this.uniques)
    },
    elementsString() {
      return `${(this.calculatedValues.length!=this.uniqueElements) ? this.calculatedValues.length+' of ' : '' }${this.uniqueElements} ${(this.uniqueElements===1) ? 'category' : 'categories'}`
    }
  },

  methods: {

    changeValue (newVal) {
      this.currentVal = newVal
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
    setValueIndex(index) {
      var item = this.calculatedValues[index]
      if (item) {
        let value = item.value;
        if (value === "") {
          value = "<span>Empty</span>"
        }
        this.currentVal = `${value}, ${item.count}, ${item.percentage}%`
      }
    },

    async updateSelected(v) {

      await this.$nextTick();

      v = v || [];

      if (arraysEqual(this.computedSelected, v)) {
        return;
      }
      
      var { index, values } = this.currentSelection.ranged || {}

      values = values || []
      index = index || -1

      if (v.length > 0 || index == this.columnIndex) {
        var newValues = v.map(i=>this.calculatedValues[i].value)
        if (!arraysEqual(values, newValues) || index != this.columnIndex) {
          this.$store.commit('selection',{
            ranged: {
              index: v.length ? this.columnIndex : -1,
              values: (!!v.length) ? newValues : [],
              indices: v
            }
          });
        }
      }
    },
  }
}
</script>
