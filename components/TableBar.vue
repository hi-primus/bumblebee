<template>
  <div class="dashboard-container">
    <v-dialog persistent :value="loadFileDialog" max-width="410" @click:outside="loadFileDialog = false">
      <v-form @submit="loadFile(loadFileUrl); loadFileDialog = false">
        <v-card>
          <v-card-title class="title px-6">Load file</v-card-title>
          <v-card-text class="pb-0 command-card-text px-6">
            <v-text-field
              v-model="loadFileUrl"
              label="Comma separated values file url"
              dense
              required
              outlined
            ></v-text-field>
          </v-card-text>
          <v-card-actions>
            <div class="flex-grow-1"/>
            <v-btn
              color="primary"
              text
              @click="loadFileDialog = false"
            >
              Cancel
            </v-btn>
            <v-btn
              color="primary"
              text
              :disabled="loadFileUrl==''"
              @click="loadFile(loadFileUrl); loadFileDialog = false"
            >
              Load
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-form>
    </v-dialog>
    <div class="toolbar bb-toolbar" :class="{'disabled': commandsDisabled}">
      <template v-if="$route.query.obeta=='42'">
        <v-btn
          text
          class="icon-btn"
          @click="loadFileDialog = true;
          loadFileUrl = ''"
          :disabled="!$store.state.kernel"
        >
          <v-icon color="#888">
            cloud_upload
          </v-icon>
        </v-btn>
        <!-- <v-btn text class="icon-btn" @click="$emit('save')" :disabled="!(dataset && dataset.summary)">
          <v-icon color="#888">
            save
          </v-icon>
        </v-btn> -->
        <div class="divider"/>
      </template>
      <v-btn text class="icon-btn" @click="$emit('update:view',0)" :disabled="!(dataset && dataset.summary)">
        <v-icon :color="(view==0) ? 'black' : '#888'">
          view_headline
        </v-icon>
      </v-btn>
      <v-btn text class="icon-btn" @click="$emit('update:view',1)" :disabled="!(dataset && dataset.summary)">
        <v-icon :color="(view==1) ? 'black' : '#888'">
          view_module
        </v-icon>
      </v-btn>
      <div class="divider"/>
      <v-menu :close-on-content-click="false" offset-y>
        <template v-slot:activator="{ on: onSortBy }">
          <v-btn
            :color="sortBy[0] ? 'black' : '#888'"
            :disabled="!(dataset && dataset.summary)"
            class="icon-btn"
            text
            v-on="onSortBy"
          >
            <!-- class="v-btn-icon-text" -->
            <v-icon>sort</v-icon>
            <span style="min-width: 2em;">
              {{ sortByLabel }}
            </span>
            <v-icon v-show="sortBy[0]" color="black" small>
              <template v-if="sortDesc[0]">arrow_downward</template>
              <template v-else>arrow_upward</template>
            </v-icon>
          </v-btn>
        </template>
        <v-list flat dense>
          <v-list-item-group :value="sortBy[0]" color="black">
            <v-list-item
              v-for="(item, i) in sortableColumnsTableHeaders"
              :key="i"
              :value="item.value"
              @click="clickSort(item.value)"
            >
              <v-list-item-content>
                <v-list-item-title>
                  <span class="sort-hint">
                    {{ item.hint }}
                  </span>
                  {{ item.text }}
                </v-list-item-title>
              </v-list-item-content>
              <v-list-item-icon>
                <v-icon v-show="item.value===sortBy[0]" color="black">
                  <template v-if="sortDesc[0]">arrow_downward</template>
                  <template v-else>arrow_upward</template>
                </v-icon>
              </v-list-item-icon>
            </v-list-item>
          </v-list-item-group>
        </v-list>
      </v-menu>
      <transition v-if="$route.query.obeta=='42'" name="fade">
        <div class="divider" v-if="detailedColumns.length>=1" />
      </transition>
      <transition v-if="$route.query.obeta=='42'" name="fade">
        <span class="columns-operations" v-if="detailedColumns.length>0" >
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn v-on="on" color="#888" text class="icon-btn" @click="commandHandle({command: 'rename'})">
                <v-icon>edit</v-icon>
              </v-btn>
            </template>
            <span>Rename column<span v-show="detailedColumns.length>1">s</span></span>
          </v-tooltip>
           <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn v-on="on" color="#888" text class="icon-btn" @click="commandHandle({command: 'duplicate'})">
                <v-icon>file_copy</v-icon>
              </v-btn>
            </template>
            <span>Duplicate column<span v-show="detailedColumns.length>1">s</span></span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn v-on="on" color="#888" text class="icon-btn" @click="commandHandle({command: 'keep'})">
                <v-icon>all_out</v-icon>
              </v-btn>
            </template>
            <span>Keep column<span v-show="detailedColumns.length>1">s</span></span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn v-on="on" color="#888" text class="icon-btn" @click="commandHandle({command: 'drop'})">
                <v-icon>delete</v-icon>
              </v-btn>
            </template>
            <span>Drop column<span v-show="detailedColumns.length>1">s</span></span>
          </v-tooltip>
          <v-tooltip bottom v-if="detailedColumns.length>1" >
            <template v-slot:activator="{ on }">
              <v-btn v-on="on" color="#888" text class="icon-btn" @click="commandHandle({command: 'nest'})">
                <v-icon>link</v-icon>
              </v-btn>
            </template>
            <span>Nest columns</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn v-on="on" color="#888" text class="icon-btn" @click="commandHandle({command: 'unnest'})">
                <v-icon>link_off</v-icon>
              </v-btn>
            </template>
            <span>Unnest column<span v-show="detailedColumns.length>1">s</span></span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn v-on="on" color="#888" text class="icon-btn" @click="commandHandle({command: 'replace'})">
                <v-icon>find_replace</v-icon>
              </v-btn>
            </template>
            <span>Replace in column<span v-show="detailedColumns.length>1">s</span></span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn v-on="on" color="#888" text class="icon-btn" @click="commandHandle({command: 'fill'})">
                <v-icon>brush</v-icon>
              </v-btn>
            </template>
            <span>Fill column<span v-show="detailedColumns.length>1">s</span></span>
          </v-tooltip>
        </span>
      </transition>
      <v-spacer></v-spacer>
      <v-btn
        v-if="$route.query.obeta=='42'"
        :disabled="!dataset.summary"
        :color="(optionsActive) ? 'black' : '#888'"
        text
        class="icon-btn"
        @click="optionsActive = !optionsActive"
      >
        <v-icon>code</v-icon>
      </v-btn>
    </div>


    <Dataset
      :commandsDisabled="commandsDisabled"
      :key="tableKey"
      :view="view"
      :dataset="dataset"
      :sortBy.sync="sortBy"
      :sortDesc.sync="sortDesc"
      :optionsActive="optionsActive"
      :detailsActive.sync="detailsActive"
      @selection="selectionEvent($event)"
      :typesSelected="typesSelected"
      :columnsTableHeaders="columnsTableHeaders"
    />
        <div class="sidebar-container" :class="{'bigger': optionsActive}" v-show="detailsActive || (optionsActive && $route.query.obeta=='42')">

      <template>
        <div class="sidebar-header" v-show="optionsActive && $route.query.obeta=='42'">
          Operations
          <v-icon class="right-button" color="black" @click="optionsActive = false">close</v-icon>
        </div>
				<v-progress-circular
          indeterminate
          v-if="commandsDisabled && optionsActive && $route.query.obeta=='42'"
          class="progress-middle"
          color="#888"
          size="64"
        />
        <Cells
          v-show="optionsActive && $route.query.obeta=='42'"
          ref="cells"
          :columns="detailedColumns"
          :commandsDisabled.sync="commandsDisabled"
          :dataset="dataset"
        />
      </template>
      <template v-if="detailsActive!==false && !optionsActive">
        <div class="sidebar-header">
          Details
          <v-icon class="right-button" color="black" @click="detailsActive = false">close</v-icon>
        </div>
        <div class="sidebar-content">

          <div v-if="detailedColumns.length>1" class="sidebar-section pr-10 columns-selected">
            <CommandMenu v-if="$route.query.obeta=='42'" :columnsNumber="detailedColumns.length" button.class="right-button-center" :disabled="commandsDisabled" @command="commandHandle($event)"></CommandMenu>
            <div class="column-selected" v-for="column in detailedColumns" :key="column.index">
              <span class="data-type" :class="`type-${dataset.columns[column.index].column_dtype}`">{{ dataType(dataset.columns[column.index].column_dtype) }}</span>
              <span class="data-type-name">{{ dataset.columns[column.index].name }}</span>
            </div>
          </div>
          <div v-if="detailsActive['heat-map']" class="heat-map plot">
            <div class="plot-title">
              Heat Map
            </div>
            <VegaEmbed
              :name="'heatmap'"
              :autosize="{
                type: 'fit'
              }"
              ref="heat-map"
              class="heat-map-grid"
              v-if="heatMap"
              :data="{values: heatMap}"
              :mark="{
                type: 'rect',
                tooltip: true
              }"
              :height="(heatMapEncoding.y2) ? 300 : undefined"
              :width="(heatMapEncoding.x2) ? 336 : undefined"
              :encoding="{
                ...heatMapEncoding,
                'color': {
                  'field': 'z',
                  title: 'n',
                  'type': 'quantitative',
                  scale: {range: ['#e6fffd', '#8cd7d0', '#4db6ac']},
                  legend: { direction: 'vertical', type: 'gradient', gradientLength: 120, titleAlign: 'left', title: ' n' },
                  // condition: { test: 'datum.z<=0', value: 'white'}
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
              >
            </VegaEmbed>
          </div>
          <template v-for="(column, i) in detailedColumns">
            <ColumnDetails
              :key="column.index"
              :startExpanded="i==0"
              :rowsCount="+dataset.summary.rows_count"
              :column="dataset.columns[column.index]"
              :commandsDisabled="commandsDisabled"
              @command="commandHandle($event)"
            ></ColumnDetails>
          </template>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import CommandMenu from '@/components/CommandMenu'
import ColumnDetails from '@/components/ColumnDetails'
import Cells from '@/components/Cells'
import Dataset from '@/components/Dataset'
import VegaEmbed from '@/components/VegaEmbed'
import dataTypesMixin from '@/plugins/mixins/data-types'

import axios from 'axios'

const api_url = process.env.API_URL || 'http://localhost:5000'

export default {
	components: {
    CommandMenu,
    ColumnDetails,
    Cells,
    Dataset,
    VegaEmbed
	},

	mixins: [dataTypesMixin],

	props: {
		dataset: {
			default: () => {
				return {}
			},
			type: Object
		},
		total: {
			default: 1,
			type: Number
		},
		view: {
			default: 0,
			type: Number
		},
		currentTab: {
			default: '',
			type: [Number, String]
		},
		searchText: {
			default: '',
			type: String
		},
		typesSelected: {
			default: () => ([]),
			type: Array
		}
	},

	data () {
		return {

      loadFileDialog: false,
      loadFileUrl: '',

      scatterPlotDisplay: [],

      detailsActive: false,
      optionsActive: false,
      commandsDisabled: false,
      operation: undefined,
      heatMap: [],
      heatMapEncoding: {},

      detailedColumns: [],
      sortBy: [],
      sortDesc: [false],
      columnsTableHeaders: [
				{ text: '', sortable: false, width: '1%', value: 'controls' },
				{ hint: '#/A', text: 'Type', value: 'column_dtype', width: '1%' },
				{ hint: 'ABC', text: 'Name', value: 'name', width: '3%' },
				{ hint: '""', text: 'Missing values', width: '2%', value: '__missing' },
				{ hint: 'null', text: 'Null values', width: '2%', value: '__na' },
				{ hint: '0', text: 'Zeros', width: '2%', value: '__zeros' },
				{ text: '', sortable: false, width: '50%', value: '' }
			]
		}
  },

	computed: {

    tableKey () {
			return this.$store.state.datasetUpdates * 100 + this.currentTab
		},

		sortByLabel () {
			if (this.sortBy[0]) {
				try {
					return this.sortableColumnsTableHeaders.find(e => e.value === this.sortBy[0]).text.split(' ')[0]
				} catch {}
			}
			return 'Sort'
		},

		sortableColumnsTableHeaders () {
			return this.columnsTableHeaders.filter(e => e.sortable !== false)
		},

		colHeaders () {
			return this.dataset.columns.map((e) => {
				return e.name
			})
    },

  },

  methods: {

    async loadFile ( file_url ) {
      this.commandsDisabled = true
      var response = await axios.post(api_url+'/dataset-file',{file: {url: file_url}})
      console.log('response',response)
      if (response.data.content=='\'load csv ok\''){
        this.commandsDisabled = false
        console.log('received')
      }

    },

    commandHandle (event) {
      this.optionsActive = true

      this.$nextTick(()=>{
        this.$refs.cells & this.$refs.cells.commandHandle(event)
      })
    },

    clickSort (by) {
			if (this.sortBy[0] !== by) {
				this.sortBy = [by]
				this.sortDesc = [false]
			} else if (this.sortDesc[0] === false) {
				this.sortDesc = [true]
			} else if (this.sortDesc[0] === true) {
				this.sortDesc = [false]
				this.sortBy = []
			}
    },

    selectionEvent (event) {
      if (event!==false) {
        this.handleSelection(event.selected, event.plotable)
      }
    },


    calculateHeatMap (xindex,yindex,xsize,ysize) {

      let xint = (xsize===+xsize)
      let yint = (ysize===+ysize)

      let xbinsize = (!xint) ? 25 : xsize
      let ybinsize = (!yint) ? 25 : ysize

      let minX = this.dataset.columns[xindex].stats.min
      let minY = this.dataset.columns[yindex].stats.min

      let maxX = this.dataset.columns[xindex].stats.max
      let maxY = this.dataset.columns[yindex].stats.max

      let jumpX = (maxX - minX) / xbinsize
      let jumpY = (maxY - minY) / ybinsize


      if (jumpX===0) {
        jumpX = 0.1
        maxX = minX + jumpX*xbinsize
      }

      if (jumpY===0) {
        jumpY = 0.1
        maxY = minY + jumpY*xbinsize
      }

      let bin = {}
      let _binElement = {}

      if (!yint)
        for (let i = 0; i < ybinsize; i++) {
          let binYIndex = (minY + jumpY*i)
          _binElement[binYIndex] = 0
        }

      if (!xint)
        for (let i = 0; i < xbinsize; i++) {
          let binXIndex = (minX + jumpX*i)
          bin[binXIndex] = {..._binElement}
        }

      for (let i = 0; i < this.dataset.sample.value.length; i++) {

        let _xv = this.dataset.sample.value[i][xindex]
        let _yv = this.dataset.sample.value[i][yindex]

        let _x = undefined
        let _y = undefined

        if (xint)
          _x = _xv
        else
          for (var x in bin) {
            if (_xv<=+x+jumpX) {
              _x = x
              break
            }
          }

        if (yint)
          _y = _yv
        else
          for (var y in bin[_x]) {
            if (_yv<=+y+jumpY) {
              _y = y
              break
            }
          }

        if (_x===undefined && !xint) {
          _x = minX + jumpX*(xbinsize-1)
        }

        if (_y===undefined && !yint) {
          _y = minY + jumpY*(ybinsize-1)
        }

        if (bin[_x] === undefined) {
          bin[_x] = {}
        }

        if (bin[_x][_y] === undefined) {
          bin[_x][_y] = 0
        }

        bin[_x][_y] = bin[_x][_y]+1
      }


      let data = []

      for (var x in bin) {
        for (var y in bin[x]) {
          if (+(bin[x][y]) != 0)
            data.push({x: x, x2: +x+jumpX, y: y, y2: +y+jumpY, z: +(bin[x][y])})
        }
      }

      return data

    },

     handleSelection (selected, plotable = []) {
      if (selected.length) {
        this.detailsActive = {}
        this.optionsActive = false
        if (plotable.length==2 && selected.length==2) {
          // this.detailsActive['scatter-plot'] = true
          this.detailsActive['heat-map'] = true
          this.heatMap = this.calculateHeatMap(plotable[0].index,plotable[1].index,plotable[0].type,plotable[1].type)


          let _x =
          (plotable[0].type==='quantitative') ? {
            x: {
              field: 'x',
              title: this.dataset.columns[plotable[0].index].name,
              type: plotable[0].type,
              bin: {
                binned: true
              }
            },
            x2: {
              field: 'x2',
            },
          }
          : {
            x: {
              field: 'x',
              title: this.dataset.columns[plotable[0].index].name,
              type: 'ordinal'
            }
          }

          let _y =
          (plotable[1].type==='quantitative') ? {
            y: {
              field: 'y',
              title: this.dataset.columns[plotable[1].index].name,
              type: plotable[1].type,
              bin: {
                binned: true
              }
            },
            y2: {
              field: 'y2',
            },
          }
          : {
            y: {
              field: 'y',
              title: this.dataset.columns[plotable[1].index].name,
              type: 'ordinal'
            }
          }

          this.heatMapEncoding ={
            ..._x,
            ..._y
          }
        }
      }
      else {
        this.detailsActive = false
      }

      this.detailedColumns = selected;
    },
  }

}
</script>

<style lang="scss">

.v-icon.control-button {
  user-select: none;
}

.hot-table-container {
  margin-top: -1px;
  padding-left: 9px;

  .wtHolder, .ht_master {
    height: inherit !important;
  }
  .wtHolder {
    overflow: scroll;
  }
}

</style>

<style lang="scss">
  .handsontable .colHeader {
    width: 100%;
  }
  .data-type-in-table.abs {
    position: absolute;
    left: 4px;
    pointer-events: none;
    top: 6px;
		max-width: 32px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .columnSorting {
    position: initial !important;
    &::before {
      right: 22px !important;
    }
  }
  .data-title {
    max-width: calc(100% - 46px);
    width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
    top: 4px;
    left: 32px;
    position: relative;
  }

  .hot-table {
    height: calc(100vh - 191px) !important;
    max-height: calc(100vh - 191px) !important;
    overflow: hidden;
  }

  // drag

  .button {
    margin-top: 35px;
  }
  .flip-list-move {
    transition: transform 0.5s;
  }
  .no-move {
    transition: transform 0s;
  }
  .ghost {
    opacity: 0.5;
  }
</style>

<style src="../node_modules/handsontable/dist/handsontable.full.css"></style>
