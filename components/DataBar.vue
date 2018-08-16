<template>

    <div class="pbar">
        <v-tooltip bottom>
            <span slot="activator">
                <div class="pb1" :style="{'width': num2+'%'}"></div>
            </span>
            <span>{{goodVal}}, {{ num2 }}%</span>
        </v-tooltip>
        <v-tooltip bottom>
            <span slot="activator">
                <div class="pb2" :style="{'width': num1+'%'}"></div>
            </span>
            <span>{{data1}}, {{ num1 }}%</span>
        </v-tooltip>
        <!-- <v-tooltip bottom>
            <span slot="activator">
                <div class="pb3" :style="{'width': num3+'%'}"></div>
            </span>
            <span>Dato 3: {{ num3 }}%</span>
        </v-tooltip> -->
    </div>

</template>

<script>

export default {

    props:{
        data1:{},
        total:{}
    },

    data(){
        return {
            num1: 0,
            num2: 0,
            goodVal: 0,
        }
    },

    beforeMount(){
        this.goodVal = this.total - this.data1;
        this.num1 = ((this.data1 * 100) / this.total).toFixed(2);
        this.num2 = ((this.goodVal * 100) / this.total).toFixed(2);
    }


}
</script>

<style lang="scss" scoped>

    // status bar
    .pbar {
        background-color: lightgray;
        height: 8px;
        border-radius: 50px;
        width: 100%;
        &:hover{
            cursor: crosshair;
        }
    }

    .pb1 {
        background-color: green;
        height: 8px;
        border-radius: 50px 0 0 50px;
        width: 50%;
        float: left;
    }

    .pb2 {
        background-color: red;
        height: 8px;
        width: 25%;
        float: left;
    }
    
    .pb3 {
        background-color: lightgray;
        height: 8px;
        border-radius: 0 50px 50px 0;
        width: 25%;
        float: left;
    }

</style>
