<template>
  <div>
    <h3>Frequent values</h3>
    <div class="scroll-container">
      <div class="freq-container">
        <div class="freq-bar" v-for="(item, index) in values" :key="index"
             @mouseover="changeValue(`Count: ${item.count}, ${item.percentage}%`)">
          <div class="freq-value" :style="{'height': item.percentage+'%'}"></div>
        </div>
      </div>
    </div>
    <div>Valor: {{ currentVal }}</div>

  </div>
</template>

<script>
  export default {

    props: ['values', 'total'],

    data() {
      return {
        sortedData: [],
        currentVal: '',
      }
    },

    methods: {
      changeValue(newVal) {
        this.currentVal = newVal;
      },
    },

    beforeMount() {

      this.changeValue(`Count: ${this.values[0].count}, ${this.values[0].percentage}%`)

    }

  }

</script>

<style lang="scss" scoped>

  .scroll-container::-webkit-scrollbar {
    width: 2px;
    height: 4px;
  }

  .scroll-container::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  .scroll-container::-webkit-scrollbar-thumb {
    background: #888;
  }

  .scroll-container {
    overflow-x: scroll;

    .freq-container {
      height: 120px;
      width: max-content;

      .freq-bar {
        height: 100%;
        width: 10px;
        margin: 0 1px;
        position: relative;
        float: left;
        &:hover {
          background-color: rgba(235, 235, 235, 0.527);
          cursor: crosshair;
        }

        .freq-value {
          width: 100%;
          background-color: #aeccde;
          height: 50%;
          position: absolute;
          bottom: 0;
        }
      }
    }

  }

  // sidechart
  .sidechart {
    margin-bottom: 5px;
    position: relative;
    font-size: 10px;
    &:hover {
      background-color: rgba(235, 235, 235, 0.527);
    }
    .bartext {
      background-color: #aeccde;
      width: 50%;
    }
    .totaltext {
      position: absolute;
      top: 0;
      left: 50%;
    }
  }

</style>
