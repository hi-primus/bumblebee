<template>
  <div class="bb-graphic" @mouseleave="currentVal = false">
    <h3 v-if="!table">Frequent values</h3>
    <BarsCanvas
      :selectable="table"
      :selected="selected"
      @update:selected="updateSelected"
      :values="values"
      :binMargin="1"
      :width="'auto'"
      :height="table ? 66 : 90"
      @hovered="setValueIndex($event)"
    />

    <div v-if="currentVal" class="current-value table-font" :title="currentVal" v-html="currentVal"></div>
    <div v-else class="current-value" :title="elementsString">{{ elementsString }}</div>
  </div>
</template>

<script>
import BarsCanvas from '@/components/BarsCanvas'
import { mapState, mapGetters } from 'vuex';
import { arraysEqual } from '@/utils/functions.js'

export default {

  components: {
    BarsCanvas
  },
	props: {
		values: {
			default: [],
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
		table: {
			default: false,
			type: Boolean
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
      currentVal: false,
      maxVal: 0,
      selected: [],
		}
  },

  beforeMount() {
    this.maxVal = this.getMaxVal(this.values)
  },

  computed: {

    ...mapGetters(['currentSelection']),
    ...mapState(['datasetSelection','tab']),

    uniqueElements () {
      return Math.max(this.values.length, this.uniques)
    },
    elementsString() {
      return `${(this.values.length!=this.uniqueElements) ? this.values.length+' of ' : '' }${this.uniqueElements} ${(this.uniqueElements===1) ? 'category' : 'categories'}`
    }
  },

  watch: {
    datasetSelection: { // store
      // deep: true,
      handler (ds) {
        if (ds[this.tab] && ds[this.tab].ranged) {
          if (ds[this.tab].ranged.index!=this.columnIndex && this.selected.length>0) {
            this.selected = []
          }
          else if (ds[this.tab].ranged.index==this.columnIndex && !arraysEqual(this.selected,ds[this.tab].ranged.indices)){
            this.selected = ds[this.tab].ranged.indices
          }
        }
      }
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
      var item = this.values[index]
      if (item)
        this.currentVal = `${item.value},&nbsp;${item.count},&nbsp;${item.percentage}%`
    },
    updateSelected(v) {


      v = v || []

      if (arraysEqual(this.selected,v)) {
        return
      }
      else {
        this.selected = v
      }


      var { index, values } = this.currentSelection.ranged || {}

      values = values || []
      index = index || -1

      if (
        (!values.length && v.length)
        ||
        index===this.columnIndex
        ||
        (v.length && index!==this.columnIndex)
      ) {
        var newValues = v.map(i=>this.values[i].value)
        if (!arraysEqual(values,newValues) || index!=this.columnIndex )
          this.$store.commit('selection',{
            ranged: {
              index: (!!v.length) ? this.columnIndex : -1,
              values: (!!v.length) ? newValues : [],
              indices: v
            }
          })
      }
    }
	}
}
</script>
