<template>

    <div>

        <!-- <h3>SUMMARY</h3>
        <table class="table is-fullwidth table is-hoverable no-line">
          <tbody>
            <tr>
              <td>vaue</td><td>1000</td><td class="level-right">1000</td>
            </tr>
          </tbody>
        </table> -->


        <h3>STATISTICS</h3>

        <table class="table">
          <tbody>
            <tr v-for="(item, key,  index) in values" :key="index">
              <td>{{key}}</td><td class="level-right">{{item}}</td>
            </tr>
          </tbody>
        </table>

    </div>

</template>

<script>
export default {

    props: ['values'],

    data(){
      return{
        arrDataset:[]
      }
    },


}
</script>

<style lang="scss" scoped>

    .no-line{
        td{
            border: none !important;
        }
    }

</style>
