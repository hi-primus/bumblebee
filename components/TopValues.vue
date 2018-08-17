<template>
  <div>

    <h3>Top values</h3>

    <table class="table">
      <thead>
      <tr>
        <th>Value</th>
        <th>Count</th>
        <th>Frequency(%)</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="(item, index) in values" :key="index">
        <td style="width:40%;" >{{item.value}}</td>
        <td style="width:20%;" >{{item.count}}</td>
        <td style="width:20%;" >{{item.percentage}}%</td>
      </tr>
      </tbody>
    </table>

    <!-- <div class="sidechart" v-for="(item, index) in values" :key="index">
      <div class="bar">
        <p class="bartext" :style="{'width': item.percentage+'%'}" >{{item.value}}</p>
        <p class="counttext">{{item.count}}</p>
        <p class="totaltext">{{item.percentage}}%</p>
      </div>
    </div> -->

  </div>
</template>

<script>
  export default {

    props: ['values', 'total'],

    data() {
      return {}
    },

  }

</script>

<style lang="scss" scoped>

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

    .counttext {
      position: absolute;
      top: 0;
      left: 30%;
    }

  }

</style>
