import Vue from 'vue'
import HOT, { HotTable, HotColumn } from '@handsontable/vue';

Vue.use(HOT)

Vue.component('HotTable',HotTable)
Vue.component('HotColumn',HotColumn)
