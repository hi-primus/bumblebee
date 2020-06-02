<template>
  <div id="vis" class="vega-component">
  </div>
</template>

<script>

var vega
var vegaLite
var vegaEmbed

export default {

  props: {
    spec: {
      type: Object
    },
    $schema: {
      type: String,
      default: 'https://vega.github.io/schema/vega-lite/v4.0.0-beta.2.json'
    },
    autosize: {
      type: [String, Object]
    },
    background: {
      type: String
    },
    padding: {
      type: [Number, Object]
    },
    config: {
      type: Object
    },
    data: {
      type: [Object, Array]
    },
    description: {
      type: String
    },
    encoding: {
      type: Object
    },
    height: {
      type: [Object, Number, String]
    },
    mark: {
      type: [Object, String]
    },
    name: {
      type: String
    },
    selection: {
      type: Object
    },
    signals: {
      type: Array
    },
    title: {
      type: [String]
    },
    transform: {
      type: Array
    },
    width: {
      type: [Object, Number, String]
    },
    layer: {
      type: Array
    },
    resolve: {
      type: Object
    }
  },

  data () {
    return {
      vl: undefined,
      _selection: [0,1]
    }
  },

  async mounted () {
    const vega = require('vega')
    const vegaLite = require('vega-lite')
    const VegaEmbed = require('vega-embed').default

    this.vl = await VegaEmbed(this.$el, this.vlSpec, {});
    this.addSignalsEmitter()
  },

  methods: {

    addSignalsEmitter () {
      const signals = this.vlSpec.signals
      var _bs = this.binSize
      if (signals && signals.length > 0) {
        signals.forEach(signal => {
          this.vl.view.addSignalListener(signal.name, (name, value) => {
            this.$emit(`signal:${name}`, value)
          })
        })
      }
    },

    removeSignalsEmitter () {
      const signals = this.vlSpec.signals
      var _bs = this.binSize
      if (signals && signals.length > 0) {
        signals.forEach(signal => {
          this.vl.view.removeSignalListener(signal.name)
        })
      }
    },

  },

  computed: {

    vlSpec () {
      return {
        spec: this.spec,
        $schema: this.$schema,
        autosize: this.autosize,
        background: this.background,
        padding: this.padding,
        config: this.config,
        data: this.data,
        description: this.description,
        encoding: this.encoding,
        height: this.height,
        mark: this.mark,
        name: this.name + Math.random()*2,
        selection: this.selection,
        signals: this.signals,
        title: this.title,
        transform: this.transform,
        width: this.width,
        layer: this.layer,
        resolve: this.resolve,
      }
    },

    dataUrl () {
      let url
      if (this.data && this.data.url) {
        url = this.data.url
      }
      return url
    }
  }
}
</script>
