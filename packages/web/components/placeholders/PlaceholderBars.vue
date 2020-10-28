<template>
  <div class="bb-placeholder-bars" :class="{'bbpb-vertical': vertical}">
    <template v-for="(bar, index) in bars">
      <div :key="index" class="bb-placeholder-bar" :style="bar || {color: 'red'}">
      </div>
    </template>
  </div>
</template>

<script>
export default {
  props: {
    n: {
      type: Number,
      default: 5
    },
    barWidth: {
      type: Number,
      default: 28
    },
    curve: {
      type: Function,
      default: (n)=>n*n
    },
    vertical: {
      type: Boolean,
      default: false
    }
  },

  computed: {

    bars () {

      var bars = [];

      for (let i = 0; i < this.n; i++) {
        var value = this.curve((this.n-i)/(this.n+1))*100 + '%';
        var bar = {}
        if (this.vertical) {
          bar.height = value;
          if (this.barWidth) {
            bar.width = this.barWidth + 'px';
          }
        } else {
          bar.width = value;
          if (this.barWidth) {
            bar.height = this.barWidth + 'px';
          }
        }
        bars.push(bar);
      }

      return bars;

    }
  }
}
</script>

<style lang="scss">
  .bb-placeholder-bars {
    display: flex;
    width: 100%;
    height: 100%;
    &:not(.bbpb-vertical) {
      flex-direction: column;
    }
  }
  .bb-placeholder-bar {
    animation: background-animation 2.1s ease-in-out infinite;
    margin-bottom: 1px;
  }

</style>
