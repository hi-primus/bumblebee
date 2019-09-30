<template>
  <div id="vis" class="vega-component">
  </div>
</template>

<script>

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
      type: Number
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
    title: {
      type: [String]
    },
    transform: {
      type: Array
    },
    width: {
      type: Number
    },
    layer: {
      type: Array
    },
    resolve: {
      type: Object
    }
  },

  mounted () {
    const vega = require('vega')
    const vegaLite = require('vega-lite')
    const vegaEmbed = require('vega-embed').default

    let vlSpec = {
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
      title: this.title,
      transform: this.transform,
      width: this.width,
      layer: this.layer,
      resolve: this.resolve,
    };

    let options = {
      // renderType: 'svg',
      // renderer: 'svg'
    }

    vegaEmbed(this.$el, vlSpec, options);
  },

  methods: {

    addSignalEmitter (vegaView, spec, component) {
      const {signals} = spec
      if (signals && signals.length > 0) {
        signals.forEach(signal => {
          vegaView.addSignalListener(signal.name, (name, value) => {
            component.$emit(`signal:${name}`, value)
          })
        })
      }
    }

  },

  beforeDestroy () {
    // this.destroyVegaView(this.$vg)
  },

  computed: {
    vegaSpec () {
      // const compileOutput = this.compileVegaLite(this.vegaLiteSpec)
      // return compileOutput.spec
      return {}
    },
    vegaLiteSpec () {
      // let vegaLiteSpec = assemblePropsToSpec.call(this, vegaLiteProps)

      // const fullSpec = this.spec
      // if (fullSpec) {
      //   Object.assign(vegaLiteSpec, fullSpec)
      //   delete vegaLiteSpec.spec
      // }

      // return vegaLiteSpec
      return {}
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
