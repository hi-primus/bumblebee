<template>
  <v-stage
    ref="konva"
    class="konva-canvas-container"
    :config="{width: w, height}"
    @mousedown="onMouseDown"
    @mousemove="onMouseMove"
    @mouseleave="setHovered(-1)"
  >
    <v-layer>
      <v-rect
        v-if="selectable && selectionRange && selectionRange.length"
        :config="{
          ...selectionRect,
          y: 0,
          height: height,
          fill: '#00000020'
        }"
      ></v-rect>
      <v-rect
        v-for="(value, index) in values"
        :key="index+'b'"
        :config="getBackConfig(index)"
        @mouseenter="setHovered(index)"
        @mouseleave="unsetHovered(index)"
      ></v-rect>
      <v-rect
        v-for="(value, index) in values"
        :key="index"
        :config="getRectConfig(index)"
      ></v-rect>
    </v-layer>
  </v-stage>
</template>

<script>

import { stepify, debounce } from 'bumblebee-utils'

export default {

  props: {
    values: {
      type: Array,
      default: () => []
    },
    selected: {
      type: Array,
      default: () => []
    },
    width: {
      type: [Number, String],
      default: 0,
    },
    binWidth: {
      type: Number,
      default: 6
    },
    maxVal: {
      type: Number,
      default: 0
    },
    binMargin: {
      type: Number,
      default: -1
    },
    height: {
      type: Number,
      default: 90
    },
    selectable: {
      type: [Boolean, String],
      default: false
    },
    yKey: {
      type: String,
      default: 'count'
    }
  },

  data () {
    return {
      selectionRange: [],
      selectionRect: {},
      rectConfig: {
        x: 10,
        y: 0,
        height: 100,
        width: 9,
        fill: "#4db6ac",
        stroke: "black",
        strokeWidth: 0
      },
      bins: this.values.map(e=>({})),
      totalWidth: 0,
      selecting: false
    }
  },

  computed: {
    calculatedMaxVal () {
      return this.maxVal || this.values.reduce( (prev,current) => prev.count>current.count ? prev : current, {count: 0} ).count || 1
    },
    binBorder () {
      return (this.binMargin >= 0) ? this.binMargin : Math.ceil( (this.totalWidth / 8) / this.values.length )
    },
    maxBinWidth () {
      return Math.max(this.height / 8, this.totalWidth / 8, 1)
    },
    calculatedBinWidth () {
      return (this.totalWidth) ? Math.floor((this.totalWidth + this.binBorder) / this.values.length) : this.binWidth
    },
    w () {
      return this.calculatedBinWidth*this.values.length
    }
  },

  beforeMount() {
    this.totalWidth = (this.width=='auto') ? 0 : this.width
  },

  mounted () {
    if (this.width=='auto') {
      this.$nextTick(()=>{
        this.fitStageIntoParentContainer()
      })
    }
  },

  watch: {
    selected (indices) {
      this.bins = this.bins.map((e,i)=>({...e, selected: indices.includes(i), selecting: false}))
    }
  },

  methods: {

    addMouseUpEventListener () {
      document.documentElement.addEventListener('mouseup', this.onMouseUp, { passive: true } )
    },
    removeMouseUpEventListener () {
      document.documentElement.removeEventListener('mouseup', this.onMouseUp )
    },

    fitStageIntoParentContainer: debounce(function () {
      var container = this.$el;
      var totalWidth = container.offsetWidth

      if (!totalWidth) {
        this.fitStageIntoParentContainer();
      } else {
        this.totalWidth = totalWidth;
      }
    }, 100),

    onMouseDown (event) {
      if (!this.selectable) {
        return
      }
      if (event.evt.which==1) {
        this.addMouseUpEventListener()
        this.selecting = true
        this.multipleSelection = event.evt.ctrlKey && this.selectable!='single'
        this.selectionRange = [event.evt.layerX, event.evt.layerX]
        this.updateSelectionRange( event.evt.layerX )
      }
      else if (event.evt.which==3 && !this.multipleSelection) {
        this.setSelection()
      }
    },

    onMouseMove (event) {
      if (!this.selectable) {
        return
      }
      if (this.selectionRange.length) {
        this.updateSelectionRange(event.evt.layerX)
      }
    },

    updateSelectionRange (layerX) {
      this.selectionRange[1] = layerX
      var sr = [...this.selectionRange]

      sr.sort((a,b)=>(a-b))

      var b2 = this.binBorder/2

      sr[0] = stepify(sr[0]+b2, this.calculatedBinWidth, Math.floor)
      sr[1] = stepify(sr[1]+b2, this.calculatedBinWidth, Math.ceil)

      var width = sr[1]-sr[0]

      if (width) {
        width -= this.binBorder
      }

      this.selectionRect = { x: sr[0], width }

      var start = +(sr[0]/this.calculatedBinWidth).toPrecision(6)
      var end = +(sr[1]/this.calculatedBinWidth).toPrecision(6)
      this.setSelection(start, end)
    },

    onMouseUp () {
      this.removeMouseUpEventListener()
      if (!this.selectable || !this.selecting) {
        return
      }
      this.selecting = false
      this.selectionRange = []
      this.selectionRect = {}
      var _s = this.bins.map((e,i)=>(e.selected || e.selecting) ? i : -1).filter(e=>(e>=0))
      if (_s!==this.selected)
        this.$emit('update:selected', _s)
    },

    setHovered (index) {
      this.bins = this.bins.map(e=>({...e, hovered: false}))
      if (index>=0) {
        this.bins[index] && ((this.bins[index].hovered = true))
      }
      this.$emit('hovered', index )
    },

    unsetHovered (index) {
      if (index>=0) {
        this.bins[index] && ((this.bins[index].hovered = false))
      }
    },

    setSelection (from = -1, to = -2) {

      if (from==to) {
        from--
      }

      if (from>=0 && !this.multipleSelection && to-from<=1 && this.bins[from] && this.bins[from].selected) {
        this.bins = this.bins.map(e=>({...e, selecting: false, selected: false}))
        return;
      }

      if (!this.multipleSelection) {
        this.bins = this.bins.map(e=>({...e, selecting: false, selected: false}))
      }

      if (from>=0) {
        for (let i = from; i < to; i++) {
          this.bins[i].selecting = true
        }
      }
    },
    getBackConfig (index) {
      return {
        ...this.rectConfig,
        width: this.calculatedBinWidth - this.binBorder,
        height: this.height,
        y: 0,
        x: this.calculatedBinWidth*index,
        fill: ( this.bins[index] && (this.bins[index].hovered || this.bins[index].selected ) && !this.bins[index].selecting) ? '#00000010' : '#0000'
      }

    },
    getRectConfig (index) {
      var h = this.height * (this.values[index].count / this.calculatedMaxVal)
      var hmin = Math.max(Math.ceil(this.binWidth/16), 2)
      var opacity = (h>hmin) ? 1 : (0.5+(h/hmin)*0.5)
      h = Math.max( h , hmin )

      return {
        ...this.getBackConfig(index),
        height: h,
        y: this.height - h,
				fill: ( this.bins[index] && (this.bins[index].hovered || this.bins[index].selected || this.bins[index].selecting )) ? '#288bc9' : '#309ee3',
				opacity,
				listening: false
      }

    },
  }
}
</script>

<style lang="scss">
  .konva-canvas-container {
    overflow: hidden;
    width: 100%;
    &>* {
      margin: auto
    }
    canvas {
      cursor: crosshair;
    }

  }
</style>
