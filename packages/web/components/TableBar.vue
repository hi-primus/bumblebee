<template>
  <div class="dashboard-container">
    <div class="toolbar bb-toolbar" :class="{'disabled': commandsDisabled}">
      <v-tooltip transition="fade-transition" bottom>
        <template v-slot:activator="{ on }">
          <v-btn v-on="on" text class="icon-btn" @click="listView=true" :disabled="!(currentDataset && currentDataset.summary)">
            <v-icon :color="(listView) ? 'black' : '#888'">
              mdi-format-list-checkbox
            </v-icon>
          </v-btn>
        </template>
        <span>Columns list view</span>
      </v-tooltip>
      <v-tooltip transition="fade-transition" bottom>
        <template v-slot:activator="{ on }">
          <v-btn v-on="on" text class="icon-btn" @click="listView=false" :disabled="!(currentDataset && currentDataset.summary)">
            <v-icon :color="(!listView) ? 'black' : '#888'">
              mdi-table
            </v-icon>
          </v-btn>
        </template>
        <span>Table view</span>
      </v-tooltip>
      <template v-for="(elements, section) in Object.values(toolbarSectionsIcons)">
        <div class="divider" :key="'d'+section" :data-keys="Object.keys(section).join()"/>
        <template v-for="(element, index) in (elements.filter(e=>!getPropertyNuxt(e.hidden)))">
          <template v-if="element.type=='button'">
            <v-tooltip :key="'toolbar'+section+'button'+index" transition="fade-transition" bottom>
              <template v-slot:activator="{ on }">
                <div class="icon-btn-container" :id="'btn-'+element.command" v-on="on">
                  <v-btn
                    text
                    class="icon-btn"
                    @click="elementOnClick(element)"
                    :disabled="getPropertyNuxt(element.disabled)"
                  >
                    <template v-for="(icon, ii) in element.icons">
                      <v-icon
                        :key="ii"
                        :color="icon.color || '#888'"
                        :style="icon.style || {}"
                        :class="icon.class || {}"
                      >
                        {{icon.icon}}
                      </v-icon>
                    </template>
                  </v-btn>
                </div>
              </template>
              <span>{{getPropertyNuxt(element.text)}}</span>
            </v-tooltip>
          </template>
          <template v-else-if="element.type=='menu'">
            <v-menu
              v-model="menus[element.group]"
              offset-y
              :key="'toolbar'+index"
            >
              <template v-slot:activator="{ on: menu }">
                <v-tooltip :disabled="menus[element.group]" transition="fade-transition" bottom>
                  <template v-slot:activator="{ on: tooltip }">
                    <div class="icon-btn-container" :id="'menu-'+element.group" v-on="{...tooltip}">
                      <v-btn
                        :color="'#888'"
                        :disabled="getPropertyNuxt(element.disabled)"
                        class="icon-btn icon-btn-menu"
                        text
                        v-on="{...menu}"
                      >
                        <template v-for="(icon, ii) in element.icons">
                          <v-icon
                            :key="ii"
                            :color="icon.color || '#888'"
                            :style="icon.style || {}"
                            :class="icon.class || {}"
                          >
                            {{icon.icon}}
                          </v-icon>
                        </template>
                        <v-icon class="dropdown-icon" :color="menus[element.group] ? 'black' : '#888'">
                          arrow_drop_down
                        </v-icon>
                      </v-btn>
                    </div>
                  </template>
                  <span>{{getPropertyNuxt(element.text)}}</span>
                </v-tooltip>
              </template>
              <v-list dense style="max-height: calc(100vh - 143px); min-width: 160px;" class="scroll-y toolbar-menu">
                <v-list-item-group color="black">
                  <template
                    v-for="(item, i) in menuItems(element.group).filter(e=>!getPropertyNuxt(e.hidden))"
                  >
                    <v-divider
                      v-if="item.divider"
                      :key="i+'mc'"
                    ></v-divider>
                    <v-list-item
                      v-else
                      :key="i+'mc'"
                      @click="commandHandle(item)"
                      :id="'menu-item-'+item.command"
                      :disabled="getPropertyNuxt(item.disabled) || !checkDataTypes(item.allowedTypes) || (item.max && selectedColumns.length>item.max) || (item.min && selectedColumns.length<item.min)"
                    >
                      <v-list-item-content>
                        <v-list-item-title>
                          {{ item.text }}
                        </v-list-item-title>
                      </v-list-item-content>
                    </v-list-item>
                  </template>
                </v-list-item-group>
              </v-list>
            </v-menu>
          </template>
          <v-menu v-else-if="element.type=='sort'" :key="index" :close-on-content-click="false" @input="menus['sort'] = $event" offset-y>
            <template v-slot:activator="{ on: menu }">
                <v-tooltip :disabled="menus['sort']" transition="fade-transition" bottom>
                  <template v-slot:activator="{ on: tooltip }">
                    <v-btn
                      :color="sortBy[0] ? 'black' : '#888'"
                      :disabled="!(currentDataset && currentDataset.summary)"
                      class="icon-btn"
                      text
                      v-on="{...tooltip, ...menu}"
                    >
                      <v-icon>sort</v-icon>
                      <span style="min-width: 2em; margin-left: -2px">
                        {{ sortByLabel }}
                      </span>
                      <v-icon v-show="sortBy[0]" color="black" small>
                        <template v-if="sortDesc[0]">arrow_downward</template>
                        <template v-else>arrow_upward</template>
                      </v-icon>
                    </v-btn>
                  </template>
                  <span>Sort columns</span>
                </v-tooltip>
              </template>
              <v-list dense>
                <v-list-item-group :value="sortBy[0]" color="black">
                  <v-list-item
                    v-for="(item, i) in sortableColumnsTableHeaders"
                    :key="i+'scth'"
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
        </template>
      </template>
      <v-spacer></v-spacer>
      <v-menu
        v-model="searchMenu"
        bottom
        left
        min-width="600px"
        :close-on-content-click="false"
        offset-y
      >
        <template v-slot:activator="{ on: menu }">
          <v-tooltip :disabled="searchMenu" transition="fade-transition" bottom>
            <template v-slot:activator="{ on: tooltip }">
              <div class="icon-btn-container mr-2" v-on="{...tooltip}">
                <v-badge
                  :value="!commandsDisabled && (filtersActive || noMatch)"
                  :color="(noMatch) ? 'error' : 'primary lighten-2'"
                  dot
                  overlap
                >
                  <v-btn
                    id="toolbar-icon-search"
                    :color="'#888'"
                    class="icon-btn"
                    text
                    :disabled="!(currentDataset && currentDataset.summary)"
                    v-on="{...menu}"
                  >
                    <v-icon color="#888">search </v-icon>
                  </v-btn>
                </v-badge>
              </div>
            </template>
            <span>Search / filter columns</span>
          </v-tooltip>
        </template>
        <div class="controls-container text-xs-center">
          <v-text-field
            autocomplete="off"
            v-model="searchText"
            :color="'grey darken-3'"
            spellcheck="false"
            dense
            full-width
            solo flat
            class="search-filter mt-2 mr-4 elevation-0"
            prepend-inner-icon="search"
            label="Search column"
            :disabled="!(currentDataset && currentDataset.summary)"
          />
          <div class="filter-container">
            <v-autocomplete
              autocomplete="off"
              ref="autocomplete"
              v-model="typesSelected"
              :items="typesAvailable"
              :append-icon="''"
              :search-input.sync="typesInput"
              dense
              full-width
              solo flat
              chips
              deletable-chips
              color="grey darken-3"
              class="placeholder-chip primary--chips capitalized--chips"
              label="Data type"
              hide-details
              hide-no-data
              hide-selected
              multiple
              single-line
              :menu-props="{
                closeOnContentClick: true
              }"
              @change="typesUpdated"
              :disabled="!(currentDataset && currentDataset.summary)"
            >
              <template v-slot:item="{ item }">
                <div class="data-type in-autocomplete">{{ dataTypeHint(item) }}</div> <span class="capitalize">{{ item }}</span>
              </template>
            </v-autocomplete>
          </div>
          <div
            v-if="currentDataset && currentDataset.columns && currentDataset.columns.length"
            class="mr-4 grey--text text--darken-2 text-caption"
            style="padding-top: 2px;">
            {{showingColumnsLength}}/{{currentDataset.columns.length}}
          </div>
          <v-btn
            v-if="filtersActive"
            :loading="clearingFilters"
            text icon
            class="mr-1"
            @click="clearFilters">
            <v-icon>
              close
            </v-icon>
          </v-btn>
        </div>

      </v-menu>
      <v-badge
        :value="codeError!=='' || (operationsTitle && operationsTitle!='operations') && cells.length!=0"
        :color="(operationsTitle!='operations') ? 'primary lighten-2' : 'error'"
        dot
        overlap
      >
        <v-btn
          id="toolbar-icon-cells"
          :color="(operationsActive!=false) ? 'black' : '#888'"
          text
          class="icon-btn"
          :class="{'active': operationsActive}"
          :disabled="!(cells.length || operationsTitle!=='operations' || codeError!=='')"
          @click="operationsActive = !operationsActive"
        >
          <v-icon>code</v-icon>
        </v-btn>
      </v-badge>
    </div>
    <Dataset
      :key="'dataset'+currentTab"
      :sortBy.sync="sortBy"
      :sortDesc.sync="sortDesc"
      :operationsActive="!!operationsActive"
      :searchText="searchText"
      @selection="selectionEvent($event)"
      @sortDrag="callSort=true"
      @sort="lastSort=$event"
      :typesSelected="typesSelected"
      :columnsTableHeaders="columnsTableHeaders"
    />
    <div class="sidebar-container" :class="{'bigger': (operationsActive && bigOptions)}" v-show="detailsActive || operationsActive">

      <template>
        <div class="sidebar-header" v-show="operationsActive && operationsTitle=='operations'">
          Operations
          <v-icon class="right-button" color="black" @click="operationsActive = false">close</v-icon>
        </div>
        <div class="sidebar-header" v-show="operationsTitle!='operations' && operationsActive">
          {{operationsTitle}}
          <v-icon class="right-button" color="black" @click="cancelCommand">close</v-icon>
        </div>
        <div class="sidebar-top" v-show="operationsTitle=='operations' && operationsActive">
          <v-tooltip transition="fade-transition" bottom color="dataprimary darken-2" v-model="copied">
            <template v-slot:activator="{on: success}">
              <v-menu offset-y left min-width="200" >
                <template v-slot:activator="{ on: more }">
                  <v-icon v-on="more" class="right-button" color="black" @click.stop="">more_vert</v-icon>
                </template>
                <v-list flat dense style="max-height: calc(100vh - 143px); min-width: 160px;" class="scroll-y">
                  <v-list-item-group color="black">
                    <!-- <v-list-item
                      @click="showCodeOnTextDialog"
                    >
                      <v-list-item-content>
                        <v-list-item-title>
                          Copy code to clipboard
                        </v-list-item-title>
                      </v-list-item-content>
                    </v-list-item> -->
                    <v-list-item
                      v-for="engine in engines"
                      :key="engine.name"
                      :disabled="!engine.init"
                      @click="showCodeOnTextDialog(engine.init)"
                    >
                      <v-list-item-content>
                        <v-list-item-title>
                          Export to {{engine.prettyName}}
                        </v-list-item-title>
                      </v-list-item-content>
                    </v-list-item>
                  </v-list-item-group>
                </v-list>
              </v-menu>
            </template>
            <span>Copied succesfully</span>
          </v-tooltip>
        </div>
        <Cells
          v-show="operationsActive"
          ref="cells"
          :big.sync="bigOptions"
          :view="operationsTitle"
          :columns="selectedColumns || []"
          @updateOperations="updateOperations"
          @showConnections="$emit('showConnections', $event)"
        />
				<!-- <v-progress-linear
          indeterminate
          v-if="commandsDisabled && operationsActive && operationsTitle=='operations'"
          color="#888"
          size="64"
          style="position: absolute; left: 0; top: 34px;"
        /> -->
      </template>
      <template v-if="detailsActive!==false && !operationsActive">
        <div class="sidebar-header">
          Details
          <v-icon class="right-button" id="details-close-btn" color="black" @click="clearSelection">close</v-icon>
        </div>
        <div class="sidebar-content">

          <div v-if="detailedColumns.length>1 && currentDataset.columns[index]" class="sidebar-section pr-10 columns-selected">
            <div class="column-selected" v-for="(index, i) in detailedColumns" :key="index+'selc'+i">
              <span class="data-type" :class="`type-${currentDataset.columns[index].stats.inferred_type.data_type}`">{{ dataTypeHint(currentDataset.columns[index].stats.inferred_type.data_type) }}</span>
              <span class="data-column-name">{{ currentDataset.columns[index].name }}</span>
            </div>
          </div>
          <div v-if="detailsActive['heat-map']" class="heat-map plot">
            <div class="plot-title" v-if="heatMap">
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
                  scale: {range: ['#dcedf7', '#84c6f0', '#309ee3']},
                  legend: { direction: 'vertical', type: 'gradient', gradientLength: 120, titleAlign: 'left', title: ' n' }
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
          <template v-for="(index, i) in detailedColumns">
            <ColumnDetails
              :key="index+'cd'"
              :startExpanded="i==0"
              :rowsCount="+currentDataset.summary.rows_count"
              :column="currentDataset.columns[index]"
              @command="commandHandle($event)"
            ></ColumnDetails>
          </template>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import ColumnDetails from '@/components/ColumnDetails'
import Cells from '@/components/Cells'
import Dataset from '@/components/Dataset'
import VegaEmbed from '@/components/VegaEmbed'
import clientMixin from '@/plugins/mixins/client'
import dataTypesMixin from '@/plugins/mixins/data-types'
import applicationMixin from '@/plugins/mixins/application'
import { objectMap, copyToClipboard, namesToIndices, getProperty, ENGINES } from 'bumblebee-utils'
import { generateCode } from 'optimus-code-api'
import { mapState, mapGetters } from 'vuex'

import { operationGroups, operationSections, operations } from '@/utils/operations'

export default {
	components: {
    ColumnDetails,
    Cells,
    Dataset,
    VegaEmbed
	},

	mixins: [clientMixin, dataTypesMixin, applicationMixin],

	props: {
		total: {
			default: 1,
			type: Number
		},
    isOperating: {
      type: Boolean,
      default: false
    }
	},

	data () {
		return {

      engines: [
        {name: 'dask', prettyName: ENGINES.dask, init: '"dask", n_workers=1, threads_per_worker=8, processes=False, memory_limit="3G"'},
        {name: 'dask_cudf', prettyName: ENGINES.dask_cudf, init: '"dask_cudf", process=True'},
        {name: 'cudf', prettyName: ENGINES.cudf, init: '"cudf"'},
        {name: 'pandas', prettyName: ENGINES.pandas, init: '"pandas"'},
        {name: 'spark', prettyName: ENGINES.spark, init: '"spark", n_workers=1, threads_per_worker=8, processes=False, memory_limit="3G"'},
        {name: 'ibis', prettyName: ENGINES.ibis, init: '"ibis"'},
        {name: 'vaex', prettyName: 'Vaex'},
      ],

      typesSelected: [],
			typesInput: '',

      copied: false,

      file: {dialog: false},

      scatterPlotDisplay: [],

      operationsActive: false,
      operationsTitle: 'operations',
      bigOptions: false,
      operation: undefined,
      heatMap: [],
      heatMapEncoding: {},

      menus: {},
      searchMenu: false,

      lastSort: [],
      callSort: false,

      searchText: '',

      clearingFilters: false,

      sortBy: [],
      sortDesc: [false],
      columnsTableHeaders: [
				{ text: '', sortable: false, width: '1%', value: 'controls' },
				{ hint: '#/A', sortable: false, text: 'Type', value: 'profilerDtype', width: '1.5%' },
				{ hint: 'ABC', sortable: false, text: 'Name', value: 'name', width: '3%' },
				{ hint: '""', sortable: false, text: 'Missing values', width: '2%', value: 'missing' },
				// { hint: 'null', text: 'Null values', width: '2%', value: 'null' },
        // { hint: '0', text: 'Zeros', width: '2%', value: 'zeros' },
				{ text: '', sortable: false, width: '50%', value: '' }
			]
    }
  },

	computed: {

    ...mapGetters([
      'currentSelection',
      'hasSecondaryDatasets',
      'workspaceCells',
      'currentListView',
      'selectionType',
      'currentDataset',
      'typesAvailable',
      'currentTab'
    ]),

    ...mapState(['nextCommand', 'noMatch', 'showingColumnsLength']),

    columns () {
      let columns = [];
      if (this.currentDataset) {
        if (this.currentDataset.columns) {
          columns = this.currentDataset.columns.map(column=>({name: column.name}));
        }
        if (this.$store.state.columns[this.currentDataset.dfName] && columns.length < this.$store.state.columns[this.currentDataset.dfName].length) {
          columns = this.$store.state.columns[this.currentDataset.dfName].map(column=>({name: column}));
        }
      }
      return columns;
    },

    customMenuItems () {
      return this.$store.getters['customCommands/menuItems'];
    },

    toolbarItems () {

      return [...operations, ...this.customMenuItems]
    },

    filtersActive () {
      return this.typesSelected.length || this.searchText || (this.currentDataset && this.columns && this.showingColumnsLength !== this.columns.length);
    },

    codeError: {
      get () {
        return this.$store.state.codeError;
      },
      set (value) {
        this.$store.commit('mutation', {mutate: 'codeError', payload: value})
      }
    },

    commandsDisabled: {
      get () {
        return this.$store.state.commandsDisabled
      },
      set (value) {
        this.$store.commit('mutation', {mutate: 'commandsDisabled', payload: value})
      }
    },

    listView: {
      get () {
        return this.currentListView
      },
      set (view) {
        this.$store.commit('setListView',view)
      }
    },

    detailsActive() {

      var selected = this.selectedColumns.map(e=>e.index)
      var detailsActive = false
      if (this.selectionType=='columns' && !selected.length) {
        detailsActive = false
      }
      else {
        detailsActive = {}
        this.operationsActive = false
      }
      if (selected.length) {

        var plotable = selected.map( (i)=>{
          var column = this.currentDataset.columns[i];
          if (!column) {
            return false;
          }
          return ['decimal','float','double','float64'].includes(column.stats.inferred_type.data_type) ? 'quantitative'
            : (['int','integer','int64'].includes(column.stats.inferred_type.data_type) && column.stats.count_uniques>25) ? 'quantitative'
            : (column.stats.count_uniques<=25) ? column.stats.count_uniques
            : false
        }).filter(v=>v);

        if (plotable.length==2 && selected.length==2) {

          this.heatMap = this.calculateHeatMap(selected[0], selected[1], plotable[0], plotable[1])

          if (this.heatMap) {
            detailsActive['heat-map'] = true

            let _x =
            (plotable[0]==='quantitative') ? {
              x: {
                field: 'x',
                title: this.columns[selected[0]].name,
                type: plotable[0],
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
                title: this.columns[selected[0]].name,
                type: 'ordinal'
              }
            }

            let _y =
            (plotable[1]==='quantitative') ? {
              y: {
                field: 'y',
                title: this.columns[selected[1]].name,
                type: plotable[1],
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
                title: this.columns[selected[1]].name,
                type: 'ordinal'
              }
            }

            this.heatMapEncoding ={
              ..._x,
              ..._y
            }
          }
        }
      }

      return detailsActive
    },

    cells: {
      get() {
        return Array.from(this.workspaceCells)
      },
      set(value) {
        // -
      }
    },

    toolbarSectionsIcons () {

      return objectMap(operationSections, operations=>{
        let elements = [];

        let groupsAdded = []

        operations.forEach(operation=>{
          let groupName = operation.group;
          if (groupName && !groupsAdded.includes(groupName)) {
            groupsAdded.push(groupName);
            elements.push({
              ...operationGroups[groupName],
              type: 'menu',
              group: groupName
            })
          } else if (!groupName) {
            if (!operation.onClick && operation.command) {
              operation.onClick = ($nuxt)=>$nuxt.commandHandle({
                command: operation.command,
                generator: operation.generator
              });
            }
            elements.push({
              ...operation,
              type: 'button'
            });
          }
        });

        return elements;
      });
    },

    detailedColumns() {
      if (this.selectionType==='text') {
        return [this.currentSelection.text.index]
      }
      if (['values','ranges'].includes(this.selectionType)) {
        return [this.currentSelection.ranged.index]
      }
      return this.selectedColumns.map(e=>e.index)
    },

    selectedColumns: {
      set (c) {
        if (this.isMounted) {
          this.$store.commit('selection',{ columns: c })
        }
      },
      get () {
        try {
          return [...this.currentSelection.columns] || []
        } catch (error) {}
        return []
      }
    },

    selectedDataTypes () {
      try {
        var columns = []
        if (this.selectionType==='columns') {
          if (!this.currentSelection.columns || !this.currentSelection.columns.length) {
            return []
          }
          columns = this.currentSelection.columns.map(e=>e.index)
        }
        else if (this.selectionType==='text') {
          columns = [this.currentSelection.text.index]
        }
        else {
          columns = [this.currentSelection.ranged.index]
        }
        if (!columns.length) {
          return []
        }
        return [...new Set(columns.map(i=>this.currentDataset.columns[i] ? this.currentDataset.columns[i].stats.inferred_type.data_type : false).filter(v=>v))]
      } catch (err) {
        console.error(err)
        return []
      }
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

    computedIsOperating () {
      return (this.operationsTitle!=='operations' && this.operationsActive)
    }

  },

  mounted () {
    this.isMounted = true
  },

  watch: {
    lastSort (lastSort) {
      this.$nextTick(()=>{
        if (this.callSort && lastSort.length) {
          this.callSort = false
          this.commandHandle({
            command: 'applySort',
            columns: lastSort,
            // ignoreCell: true,
            noCall: true,
            deleteOtherCells: true
          })
        }
      })
    },

    socketAvailable (value) {
      if (!value && this.commandsDisabled) {
        this.commandsDisabled = false
      }
    },

    computedIsOperating (value) {
      this.$emit('update:isOperating', value)
    },

    currentDataset () {
      this.lastSort = []
    },

    codeError (value) {
      if (value!='') {
        this.operationsActive = true
        this.operationsTitle = 'operations'
      }
    },

    nextCommand (command) {
      if (command) {
        this.commandHandle(command)
      }
    },

    cells (cells) {
      if (cells.length==0) {
        this.operationsActive = false
      }
    },

    filtersActive (value) {
      if (value) {
        this.clearingFilters = false;
      }
    }
  },

  methods: {

    getProperty,

    getPropertyNuxt(property) {
      return getProperty(property, [this]);
    },

    elementOnClick(element) {
      return element.onClick(this);
    },

    async clearFilters () {
      this.$store.commit('setHiddenColumns', {});
      this.searchText = '';
      this.typesSelected = [];
      await this.$nextTick();
      this.clearingFilters = true;
    },

    runCodeNow (forceAll = false, ignoreFrom = -1, newDfName, runCodeAgain) {
      return this.$refs.cells.runCodeNow(forceAll, ignoreFrom, newDfName, runCodeAgain);
    },

    downloadDataset () {
      this.$refs.cells & this.$refs.cells.downloadDataset(event)
    },

    downloadDatasetRerun () {
      this.$refs.cells & this.$refs.cells.downloadDatasetRerun(event)
    },

    compileDataset () {
      this.$refs.cells & this.$refs.cells.compileDataset(event)
    },

    showTextDialog(text, title = 'Result') {
      this.$refs.cells & this.$refs.cells.showTextDialog(text, title)
    },

    checkDataTypes (allowedTypes) {
      if (!allowedTypes || !allowedTypes.length) {
        return true
      }

      return this.selectedDataTypes.every(t=>allowedTypes.indexOf(t)>=0)
    },

    typesUpdated () {
      this.typesInput = ''
      this.$refs.autocomplete.loseFocus
		},

    updateOperations (event) {
      var {active, title} = event
      if (active!==undefined) this.operationsActive = active
      this.operationsTitle = title
    },

    clearSelection () {
      this.$store.commit('selection',{ clear: true })
    },

    menuItems (group) {
      return this.toolbarItems.filter(e => e.group==group)
    },

    async showCodeOnTextDialog (engineText) {

      var finalPayload = await this.$store.dispatch('finalCommands', { ignoreFrom: -1, include: [], noPandas: true });

      var code = 'from optimus import Optimus\n'
      +'from optimus.expressions import Parser\n'
      +'p = Parser()\n'
      +`op = Optimus(${engineText})\n`
      + generateCode(finalPayload)[0];

      code = code.trim();

      this.showTextDialog(code, 'Code')
    },

    cancelCommand () {
      this.$nextTick(()=>{
        this.$refs.cells & this.$refs.cells.cancelCommand()
      })
    },

    commandHandle (event) {

      if (event.command==='Download') {
        this.downloadDataset()
      } else if (event.command==='Download-rerun') {
        this.downloadDatasetRerun()
      } else if (event.command==='Compile') {
        this.compileDataset()
      } else {
        this.$nextTick(()=>{
          this.$refs.cells & this.$refs.cells.commandHandle(event)
        })
      }

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
        this.handleSelection(event.selected, event.indices)
      }
    },


    calculateHeatMap (xindex,yindex,xsize,ysize) {

      if (!this.currentDataset.sample || !this.currentDataset.sample.value) {
        return false
      }

      let xint = (xsize===+xsize)
      let yint = (ysize===+ysize)

      let xbinsize = (!xint) ? 25 : xsize
      let ybinsize = (!yint) ? 25 : ysize

      let minX = this.currentDataset.columns[xindex].stats.min
      let minY = this.currentDataset.columns[yindex].stats.min

      let maxX = this.currentDataset.columns[xindex].stats.max
      let maxY = this.currentDataset.columns[yindex].stats.max

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

      for (let i = 0; i < this.currentDataset.sample.value.length; i++) {

        let _xv = this.currentDataset.sample.value[i][xindex]
        let _yv = this.currentDataset.sample.value[i][yindex]

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

     handleSelection (selected, indices = true) {

      if (!indices) {
        selected = namesToIndices(selected, this.columns)
      }

      this.selectedColumns = selected.filter(e=>this.columns[e]).map(e=>({index: e, name: this.columns[e].name}))
    },
  }

}
</script>

<style lang="scss">

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
