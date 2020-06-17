<template>
  <div @mouseleave="nowValues = false">
    <BarsCanvas
      :selectable="'single'"
      :values="data.hist"
      :binMargin="1"
      :width="'auto'"
      :height="160"
      @hovered="getHover($event)"
      @update:selected="updateSelection"
    />
    <div class="range-hover mb-2">
      <template v-if="nowValues">
        {{ nowValues }}
      </template>
      <template v-else-if="selection && selection.length">
        {{ selection.map(s=>`${s[0]} - ${s[1]}`).join(',   ') }}
      </template>
      <template v-else>
        {{ lower }} - {{ upper }}
      </template>
      &nbsp;
    </div>
  </div>
</template>

<script>
/*bu*/ import { throttle, reduceRanges } from 'bumblebee-utils' /*bu*/

import BarsCanvas from '@/components/BarsCanvas'

export default {

  components: {
    BarsCanvas,
  },

  data () {
    return {
      nowValues: false
    }
  },

	props: {
    selection: {
      default: ()=>([]),
      type: Array
    },
		data: {
			default: ()=>({}),
			type: Object
    },
    columnName: ''
  },

  mounted () {
    this.updateSelection([])
  },

  methods: {
    getHover (index) {
      var value = this.data.hist[index]
      if (value && value.lower) {
        this.nowValues = value.lower + ' - ' + value.upper + ', ' + value.count
      }
      else {
        this.nowValues = false
      }
    },
    updateSelection (indices = []) {

      var ranges = indices.map(index=>[this.data.hist[index].lower, this.data.hist[index].upper])
      ranges = reduceRanges(ranges)

      this.$emit('update:selection', ranges )

    },
  },

  computed: {
    binSize () {
      try {
        var values = this.data.hist
        var bs = (values[values.length-1].upper-values[0].lower)/values.length
        return bs
      } catch (error) {
        return 1
      }
    },
    offset () {
      try {
        var values = this.data.hist
        return values[0].lower
      } catch (error) {
        return 0
      }
    },
    upper () {
      var values = this.data.hist
      return values[values.length-1].upper
    },
    lower () {
      var values = this.data.hist
      return values[0].lower - this.binSize
    }
  }
}
</script>

<style lang="scss" scoped>

</style>

