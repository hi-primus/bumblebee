<template>
  <div @mouseleave="nowValues = false">
    <VegaEmbed
      :name="'hist'"
      ref="hist"
      class="hist-grid pa-0"
      style="margin: -5px;"
      v-if="data.hist"
      :data="{values: data.hist}"
      :mark="{
        type: 'bar',
      }"
      :selection="{
        brush: {
          type: 'interval',
          encodings: 'x'
        },
        hover: {
          type: 'single',
          fields: ['lower','upper','count'],
          on: 'mouseover'
        },
        col: {
          type: 'single',
          fields: ['lower','upper'],
          bind: {
            lower: {input: 'range', min: lower, max: upper + binSize},
            upper: {input: 'range', min: lower, max: upper + binSize}
          }
        }
      }"
      :height="160"
      :signals="[
        {name: 'brush'},
        {name: 'hover'},
      ]"
      :width="770"
      :encoding="{
        x: {
          field: 'lower',
          bin: 'binned',
          type: 'quantitative'
        },
        x2: {
          field: 'upper'
        },
        y: {
          type: 'quantitative',
          field: 'count'
        },
        color: {
          condition: [
            {
              test: `(datum['lower'] < col_lower) || (datum['upper'] > col_upper)`,
              value: 'grey'
            },
            {
              test: `(datum['lower'] > ${data.lower_bound}) && (datum['upper'] < ${data.upper_bound})`,
              value: '#4db6ac'
            }
          ],
          value: '#e57373'
        }
      }"
      :config="{
        view: {
          strokeWidth: 0,
          stroke: 'transparent',
          step: 13
        },
        axis: {
          titleOpacity: 0,
          domainColor: '#fff',
          title: 0,
          gridColor: '#fff',
          ticks: false,
          domainOpacity: 0,
          gridOpacity: 0,
          tickOpacity: 0,
          labelPadding: 0,
          labels: false,
        },
      }"
      @signal:brush="updateRange"
      @signal:hover="getHover"
      >
    </VegaEmbed>
    <div class="range-hover mb-2">
      <template v-if="nowValues">
        {{ nowValues }}
      </template>
      <template v-else-if="selection && selection.length>=2">
        {{selection[0]}} - {{selection[1]}}
      </template>
      &nbsp;
    </div>
  </div>
</template>

<script>
import VegaEmbed from '@/components/VegaEmbed'
import { throttle } from '@/utils/functions.js'

export default {

  components: {
    VegaEmbed
  },

  data () {
    return {
      nowValues: false
    }
  },

	props: {
    selection: {
      default: ()=>([0,0]),
      type: Array
    },
		data: {
			default: ()=>({}),
			type: Object
    },
    columnName: ''
  },

  mounted () {
    this.updateRange({lower: undefined})
  },

  methods: {
    getHover (value) {
      if (value && value.lower && value.lower.length) {
        this.nowValues = value.lower + ' - ' + value.upper + ', ' + value.count
      }
      else if (this.selection.length<2) {
        this.nowValues = this.lower + ' - ' + this.upper
      }
      else {
        this.nowValues = false
      }
    },
    updateRange: throttle ( async function (range) {

      var a = [this.lower,this.upper]

      var binSize = this.binSize

			if (range.lower) {
				var offset = this.offset
				a = [...range.lower]
				a[0] = +( ( Math.floor( (a[0]-offset)/binSize ) * binSize ) + offset ).toFixed(8)
        a[1] = +( (  Math.ceil( (a[1]-offset)/binSize ) * binSize ) + offset ).toFixed(8)
        this.$emit('update:selection',a)
      }
      else {
        this.$emit('update:selection',[])
      }

      if (this.$refs.hist) {
        function triggerEvent(el, type){
          if ('createEvent' in document) {
            // modern browsers, IE9+
            var e = document.createEvent('HTMLEvents');
            e.initEvent(type, false, true);
            el.dispatchEvent(e);
          } else {
            // IE 8
            var e = document.createEventObject();
            e.eventType = type;
            el.fireEvent('on'+e.eventType, e);
          }
        }

        this.$refs.hist.$el.getElementsByTagName('input')['col_lower'].value = a[0]-binSize
        this.$refs.hist.$el.getElementsByTagName('input')['col_upper'].value = a[1]

        triggerEvent(this.$refs.hist.$el.getElementsByTagName('input')['col_lower'],'input')
        triggerEvent(this.$refs.hist.$el.getElementsByTagName('input')['col_upper'],'input')
      }

    },100),
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

