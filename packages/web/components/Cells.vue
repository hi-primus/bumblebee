<template>
  <div class="sidebar-content">
    <FormDialog focus ref="formDialog"/>
    <div class="sidebar-top">
      <v-tooltip bottom transition="tooltip-fade-transition">
        <template v-slot:activator="{ on }">
          <v-icon :class="{'hidden-icon-btn': !selectedCells.length}" @click.stop="clearCellsSelection" v-on="on">mdi-close-box-outline</v-icon>
        </template>
        <span>Clear selection</span>
      </v-tooltip>
        
      <v-spacer></v-spacer>
      <v-tooltip bottom transition="tooltip-fade-transition">
        <template v-slot:activator="{ on }">
          <transition name="fade">
            <v-icon 
              :class="{'hidden-icon-btn': !selectedCells.length}"
              :disabled="selectedCells.length == 1"
              @click.stop="saveMacro()"
              v-on="on"
            >mdi-content-save-outline</v-icon>
          </transition>
        </template>
        <span>Save in macro</span>
      </v-tooltip>
      <v-tooltip bottom transition="tooltip-fade-transition">
        <template v-slot:activator="{ on }">
          <transition name="fade">
            <v-icon 
              :class="{'hidden-icon-btn': !selectedCells.length}"
              :disabled="selectedCells.length > 1"
              @click.stop="editCell(-1)"
              v-on="on"
            >edit</v-icon>
          </transition>
        </template>
        <span>Edit cell</span>
      </v-tooltip>
      <v-tooltip bottom transition="tooltip-fade-transition">
        <template v-slot:activator="{ on }">
          <transition name="fade">
            <v-icon :class="{'hidden-icon-btn': !selectedCells.length}"  @click.stop="removeCells" v-on="on">delete</v-icon>
          </transition>
        </template>
        <span>{{selectedCells.length > 1 ? "Remove cells" : "Remove cell"}}</span>
      </v-tooltip>
      <v-menu offset-y left min-width="200" >
        <template v-slot:activator="{ on: more }">
          <v-icon v-on="more" @click.stop="">more_vert</v-icon>
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
    </div>
    <v-dialog
      v-if="textDialog"
      :value="textDialog"
      @input="textDialog = $event ? textDialog : false"
      max-width="900"
    >
      <v-card>
        <v-btn
          icon large color="black"
          @click="textDialog = false"
          class="title-button-left">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        <v-card-title class="title">{{textDialog.title}}</v-card-title>
        <v-card-text class="pb-5" style="max-height: 70vh; overflow-y: auto;">
          <div class="copy-code-content">
            <span>{{textDialog.text}}</span>
            <v-tooltip transition="tooltip-fade-transition" left color="dataprimary darken-2" content-class="dialog-tooltip" v-model="copied">
              <template v-slot:activator="{ on: copied }">
                <v-icon @click.stop="clickCopy(textDialog.text, $event)">content_copy</v-icon>
              </template>
              <span>Copied succesfully</span>
            </v-tooltip>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
    <CommandFormContainer
      v-if="command && command.dialog"
      v-show="(currentCommand.command && view!='operations')"
      :currentCommand="currentCommand"
      :command="command"
      @cancelCommand="cancelCommand"
    >
      <v-form @submit.prevent="confirmCommand" id="operation-form" class="pl-4 pr-5 pt-2 operation-form" autocomplete="off">
          <div class="operation-body body-2 mb-1 mt-2" :class="{'title': command.dialog.bigText}" v-if="command.dialog.text">
            {{
              {value: command.dialog.text, args: [currentCommand]} | property
            }}
          </div>
          <div class="progress-middle" style="height: 65%">
            <v-progress-circular
              indeterminate
              color="#888"
              size="64"
              v-if="currentCommand._loading == 'block'"
            />
          </div>
          <div class="o-fields" :class="{'disabled': currentCommand._loading}">
            <template  v-if="getProperty(command.dialog.output_cols, [currentCommand])">
              <OutputColumnInputs :fieldLabel="command.dialog.output_cols_label" :noLabel="!command.dialog.output_labels" :currentCommand.sync="currentCommand"></OutputColumnInputs>
            </template>
            <template v-if="currentCommand._loading !== 'block' && command.dialog.fields">
              <template v-for="field in getProperty(command.dialog.fields, [currentCommand]).filter(f=>(!f.condition || f.condition && f.condition(currentCommand)))">

                <OperationField
                  v-if="getProperty(field.type,[currentCommand])!='repeat'"
                  :key="field.key"
                  :value.sync="currentCommand[field.key]"
                  :field="field"
                  :command="command"
                  :currentCommand.sync="currentCommand"
                  :commandMethods="commandMethods"
                  @showConnections="$emit('showConnections', $event)"
                />
                <template v-else>
                  <template v-for="(fieldGroup, i) in currentCommand[field.key]">
                    <!-- <div v-if="i>0" :key="'separator'+i+field.key" class="separator"></div> -->
                    <template v-for="subfield in field.fields">
                      <OperationField
                        :key="field.key+i+subfield.key"
                        :value.sync="getProperty(currentCommand[subfield.key],[currentCommand])[i]"
                        :field="subfield"
                        :currentCommand.sync="currentCommand"
                        :command="command"
                        :index="i"
                        :commandMethods="commandMethods"
                        @showConnections="$emit('showConnections', $event)"
                      />
                    </template>
                    <v-btn depressed class="btn-squared" :key="'remove'+i+field.key" color="error" @click="currentCommand = field.removeOne(currentCommand, i)">
                      <v-icon>close</v-icon>
                    </v-btn>
                  </template>
                  <v-btn
                    :key="'addNewRepeat'+field.key"
                    outlined
                    rounded
                    style="margin-left: auto; margin-right: auto; margin-top: -4px"
                    class="btn-squared"
                    color="primary"
                    @click="currentCommand = field.addOne(currentCommand)"
                  >
                    <v-icon>add</v-icon>
                  </v-btn>
                </template>
              </template>
            </template>
            <div class="o-field" style="padding-top: 10px; padding-left: 6px;" v-if="getProperty(command.dialog.save_new, [currentCommand])">
              <v-switch
                v-model="currentCommand.request.createsNew"
                :id="'field-createsNew'"
                color="primary"
                :label="'Create in new tab: ' + (currentCommand.request.createsNew ? 'Yes' : 'No')"
              ></v-switch>
            </div>
            <div class="o-field" style="padding-top: 10px; padding-left: 6px;" v-if="currentCommand.request.isSave">
              <v-switch
                v-model="currentCommand.request.toCell"
                :id="'field-createsNew'"
                color="primary"
                :label="'Add cell to workspace operations: ' + (currentCommand.request.toCell ? 'Yes' : 'No')"
              ></v-switch>
            </div>
            <template>
              <v-alert key="error" type="error" class="mt-0" dismissible v-if="currentCommand.error"  @input="currentCommand.error=''">
                {{currentCommand.error}}
              </v-alert>
            </template>
          </div>
          <div
            class="o-results pb-2"
            v-if="currentPreviewInfo && (typeof currentPreviewInfo.rowHighlights=='number' || command.dialog.filteredPreview || currentPreviewInfo.newColumns || currentPreviewInfo.replacingColumns)">
            <template
              v-if="typeof currentPreviewInfo.rowHighlights=='number'"
            >
              <div :class="{
                  'error--text': !currentPreviewInfo.rowHighlights,
                  'text--darken-2': currentPreviewInfo.rowHighlights
                }">
                Matching rows: {{currentPreviewInfo.rowHighlights}}
              </div>
            </template>
            <template v-else-if="command.dialog.filteredPreview">
              <div class="grey--text">
                Matching rows: loading...
              </div>
            </template>
            <div
              v-if="typeof currentPreviewInfo.newColumns=='number' && currentPreviewInfo.newColumns"
            >
              New columns: {{currentPreviewInfo.newColumns}}
            </div>
            <div
              v-if="typeof currentPreviewInfo.replacingColumns=='number' && currentPreviewInfo.replacingColumns"
            >
              Replacing columns: {{currentPreviewInfo.replacingColumns}}
            </div>
          </div>
          <div class="o-buttons">
            <template v-if="command.dialog.filteredPreview">
              <v-checkbox
                :disabled="(!currentPreviewInfo.rowHighlights || typeof currentPreviewInfo.rowHighlights !== 'number')"
                class="filter-results-checkbox"
                v-model="currentCommand.preview.filteredPreview"
                :label="`Filter results: ${currentCommand.preview.filteredPreview ? 'Yes' : 'No'}`"
              ></v-checkbox>
            </template>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              id="btn-command-cancel"
              class="mr-4"
              dense
              text
              @click="cancelCommand(); clearSelection();"
            >
              Cancel
            </v-btn>
            <v-btn
              color="primary"
              id="btn-command-submit"
              depressed
              dense
              :disabled="(command.dialog.validate && !command.dialog.validate(currentCommand)) || (storePreviewError && !allowError) || (command.dialog.filteredPreview && !currentPreviewInfo.rowHighlights)"
              :loading="currentCommand.loadingAccept"
              type="submit"
              form="operation-form"
            >
              {{
                {value: (command.dialog.acceptLabel || 'Accept'), args: [currentCommand]} | property
              }}
            </v-btn>
          </div>
          <div class="o-error" v-if="previewError">
            <v-tooltip transition="tooltip-fade-transition" left content-class="bar-tooltip" color="primary">
              <template v-slot:activator="{on}">
                <transition :duration="210" name="bounce">
                  <v-icon class="primary error-badge" v-on="on">
                    warning
                  </v-icon>
                </transition>
              </template>
              <span>{{previewError}}</span>
            </v-tooltip>
          </div>
      </v-form>
    </CommandFormContainer>
    <div
      v-show="view=='operations'"
      class="sidebar-content operations-cells-container"
      :class="{'empty': !cells.length}"
      ref="cells-container"
    >
      <draggable
        tag="div"
        class="operations-cells data-sources-cells"
        :class="{ 'no-pe disabled': operationsDisabled, 'dragging': drag }"
        :list="localDataSources"
        v-bind="dataSourcesDragOptions"
        handle=".handle"
        @start="draggableStart"
        @end="draggableEnd(false)"
      >
        <div
          class="cell-container"
          v-for="(cell, index) in localDataSources"
          :key="cell.id"
          :class="{
            'cell-selected': cellsSelection[index],
            'fixed-cell': cell.fixed, 
            'cell-error': cell.error,
            'done': cell.done
          }"
        >
          <div class="cell">
            <div class="handle left-handle">
              <v-icon>drag_indicator</v-icon>
            </div>
            <div
              class="handle operation-hint-text"
              :class="{'multiple-tabs': hasSecondaryDatasets}"
              @click="selectCell(index)"
              v-html="cell.content || cell.code"
            >
            </div>
            <div class="right-cell-btn">
              <v-icon
                small
                @click="removeCell(index, true)"
              >close</v-icon>
            </div>
          </div>
        </div>
      </draggable>
      <draggable
        tag="div"
        class="operations-cells commands-cells"
        :class="{ 'no-pe disabled': operationsDisabled, 'dragging': drag }"
        :list="localTransformations"
        v-bind="commandsDragOptions"
        handle=".handle"
        @start="draggableStart"
        @end="draggableEnd(false)"
      >
        <div
          class="cell-container"
          v-for="(cell, index) in localTransformations"
          :key="cell.id"
          :class="{
            'cell-selected': cellsSelection[index+dataSources.length],
            'fixed-cell': cell.fixed, 
            'cell-error': cell.error,
            'done': cell.done
          }"
        >
          <div class="cell">
            <div class="handle left-handle">
              <v-icon>drag_indicator</v-icon>
            </div>
            <div
              class="handle operation-hint-text"
              :class="{'multiple-tabs': hasSecondaryDatasets}"
              @click="selectCell(index+dataSources.length)"
              v-html="cell.content || cell.code"
            >
            </div>
            <div
              class="right-cell-btn"
              @click="removeCell(index, false)"
            >
              <v-icon
                small
              >close</v-icon>
            </div>
          </div>
        </div>
      </draggable>
      <template v-if="errorAlerts.length">
        <v-alert 
          v-for="alert in errorAlerts"
          :key="'error-'+alert.id"
          type="error"
          class="mt-3"
          dismissible
          @input="removeErrorAlert(alert.id)"
          :close-icon="($store.state.cells.error == alert.id && !firstRun) ? 'mdi-arrow-u-left-top' : 'cancel'"
        >{{alert.content}}</v-alert>
        <v-btn
          v-if="$store.state.enableReload"
          color="primary"
          class="mx-a d-block"
          @click="reloadPage"
          depressed
        >Reload page<v-icon>refresh</v-icon></v-btn>
        <div style="width: 100%">
        </div>
      </template>
    </div>
  </div>
</template>

<script>

import CommandFormContainer from '@/components/CommandFormContainer'
import OutputColumnInputs from '@/components/OutputColumnInputs'
import Outliers from '@/components/Outliers'
import OperationField from '@/components/OperationField'
import FormDialog from "@/components/FormDialog"
import clientMixin from '@/plugins/mixins/client'
import applicationMixin from '@/plugins/mixins/application'
import { mapGetters } from 'vuex'
import { generateCode } from 'optimus-code-api'

import {
  copyToClipboard,
  deepCopy,
  debounce,
  getProperty,
  filterCells,
  hlParam,
  namesToIndices,
  getCodePayload,
  transformDateFromPython,
  STRING_TYPES,
  ENGINES
} from 'bumblebee-utils'

import { commandsHandlers } from '@/utils/operations'

export default {

  components: {
    FormDialog,
    CommandFormContainer,
		OutputColumnInputs,
		OperationField,
    Outliers
  },

  mixins: [ clientMixin, applicationMixin ],

  props: {
    view: {
      default: false
    },
    big: {
      default: false
    },
    columns: {
      type: Array,
      default: ()=>{return []}
    }
  },

  data () {
    return {

      engines: [
        {name: 'dask', prettyName: ENGINES.dask, init: '"dask"'},
        {name: 'dask_cudf', prettyName: ENGINES.dask_cudf, init: '"dask_cudf", process=True'},
        {name: 'cudf', prettyName: ENGINES.cudf, init: '"cudf"'},
        {name: 'pandas', prettyName: ENGINES.pandas, init: '"pandas"'},
        {name: 'spark', prettyName: ENGINES.spark, init: '"spark"'},
        {name: 'ibis', prettyName: ENGINES.ibis, init: '"ibis"'},
        {name: 'vaex', prettyName: 'Vaex'},
      ],

      previewError: false,

      textDialog: false,
      copied: false,

      barTop: 0,
      barHovered: false,

      activeCell: -1,
      drag: false,
      currentCommand: false,

      cellsPromise: false,
      cellsSelection: {}

    }
  },

  computed: {

    ...mapGetters([
      'dataSources',
      'transformations',
      'currentSelection',
      'currentDataset',
      'selectionType',
      'currentDuplicatedColumns',
      'currentPreviewNames',
      'currentPreviewInfo',
      'secondaryDatasets',
      'loadPreview',
      'hasSecondaryDatasets'
    ]),

    selectedCells () {
      return Object.entries(this.cellsSelection).filter(([index, selected]) => selected).map(([index, selected]) => index)
    },

    errorAlerts () {
      return this.$store.state.errorAlerts;
    },

    customCommandsHandlers () {
      return this.$store.getters['customCommands/handlers'];
    },

    gettingNewResults: {
      get () {
        return this.$store.state.gettingNewResults;
      },
      set (value) {
        this.$store.commit('mutation', {mutate: 'gettingNewResults', payload: value})
      }
    },

    isEditing: {
      get () {
        return this.$store.state.editing;
      },
      set (value) {
        this.$store.commit('mutation', {mutate: 'editing', payload: value})
      }
    },

    lastWrongCode: {
      get () {
        try {
          return this.$store.state.lastWrongCode.code;
        } catch (err) {
          return '';
        }
      },
      set (value) {
        if (!value) {
          value = { code: '', error: false };
        }
        this.$store.commit('mutation', {mutate: 'lastWrongCode', payload: value});
      }
    },

    firstRun: {
      get () {
        return this.$store.state.firstRun;
      },
      set (value) {
        this.$store.commit('mutation', {mutate: 'firstRun', payload: value})
      }
    },

    codeDone: {
      get () {
        return this.$store.state.codeDone;
      },
      set (value) {
        this.$store.commit('mutation', {mutate: 'codeDone', payload: value});
      }
    },

    localTransformations: {
      deep: true,
      get () {
        return Array.from(this.transformations);
      },
      set (transformations) {
        this.$store.commit('setTransformations', transformations);
        this.$store.dispatch('session/saveWorkspace');
      }
    },

    localDataSources: {
      deep: true,
      get () {
        return Array.from(this.dataSources);
      },
      set (dataSources) {
        this.$store.commit('setDataSources', dataSources);
        this.$store.dispatch('session/saveWorkspace');
      }
    },

    cells: {
      get () {
        return [...this.localDataSources, ...this.localTransformations]
      },
      set (value) {
        this.localTransformations = value.filter(e=>!(e && e.payload && e.payload.request && e.payload.request.isLoad))
        this.localDataSources = value.filter(e=>e && e.payload && e.payload.request && e.payload.request.isLoad)
      }
    },

    command () {
      try {
        if (this.currentCommand) {
          return this.getCommandHandler(this.currentCommand)
        }
        return undefined;
      } catch (error) {
        console.error(error)
        return undefined
      }
      // command.dialog && (currentCommand.command == key || currentCommand.type == key)
    },

    allColumns () {
      try {
        let columns = [];
        if (this.currentDataset) {
          if (this.currentDataset.columns) {
            columns = this.currentDataset.columns.map(column=>column.name);
          }
          if (this.$store.state.columns[this.currentDataset.dfName] && columns.length < this.$store.state.columns[this.currentDataset.dfName].length) {
            columns = this.$store.state.columns[this.currentDataset.dfName].map(column=>column);
          }
        }
        return columns;
      } catch (err) {
        return []
      }
    },

    profiledColumns () {
      try {
        return this.currentDataset.columns.map(e=>e.name)
      } catch (err) {
        return []
      }
    },

    dataSourcesDragOptions () {
      return {
        animation: 200,
        group: "dataSources",
        disabled: this.commandsDisabled,
        ghostClass: "ghost"
      }
    },

    commandsDragOptions () {
      return {
        animation: 200,
        group: "commands",
        disabled: this.commandsDisabled,
        ghostClass: "ghost"
      }
    },

    storePreviewError () {
      try {
        return this.currentPreviewInfo.error
      } catch (err) {
        return false
      }
    },

    commandsDisabled: {
      get () {
        return this.$store.state.commandsDisabled
      },
      set (value) {
        this.$store.commit('mutation', {mutate: 'commandsDisabled', payload: value});
      }
    },

    operationsDisabled () {
      return this.commandsDisabled || this.$store.getters['loadingStatus']
    }

  },

  mounted () {
    window.runMacro = (macro) => {
      return this.runMacro(macro)
    };
    window.getCommandHandler = (command) => {
      return this.getCommandHandler(command)
    };

    window.runCells = ()=>{
      this.runCodeNow(true)
    }
  },

  watch: {

    currentSelection: {
      deep: true,
      handler (selection) {

        try {

          if (!selection || !selection.ranged || selection.ranged.index<0 || !this.currentDataset.columns[selection.ranged.index]){
            return
          }

          var command = { command: 'REMOVE_KEEP_SET' }

          command.columns = [ this.currentDataset.columns[selection.ranged.index].name ]

          command.payload = { rowsType: this.selectionType }

          if (this.selectionType=='ranges') {
            command.payload.selection = selection.ranged.ranges
          } else if (this.selectionType=='values') {
            command.payload.selection = selection.ranged.values
          } else {
            return
          }

          this.commandHandle(command)

        } catch (err) {
          console.error(err)
        }
      },
    },

    loadPreview ({meta}) {
      var c = { ...this.currentCommand }

      try {
        if (c.command==='loadFile' && meta) {
          if (meta.sheet_names!==undefined) {
            c._sheet_names = meta.sheet_names
            if (meta.sheet_names && meta.sheet_names.length && !meta.sheet_names.includes(c.sheet_name)) {
              c.sheet_name = meta.sheet_names[0]
            }
          }
          if (meta.file_name) {
            c._fileName = meta.file_name
          }
          if (meta.mime_info) {
            if (meta.mime_info.file_type) {
              c._fileType = meta.mime_info.file_type
            }
          }
        }
      } catch (error) {
        console.error(error)
      }

      this.currentCommand = c
    },

    storePreviewError (error) {
      this.setPreviewError(error)
      if (!error) {
        this.previewError = false;
      }
    },

    view (value) {
      if (value=='operations' || !value) {
        this.currentCommand = false
      }
    },

    barHovered (value) {
      if (!value) {
        this.moveBarDelayed(this.barTop)
      }
    },

    currentCommand: {
      deep: true,
      async handler (currentCommand) {
        this.$store.commit('setPreviewInfo', {error: false})
        if (!currentCommand) {
          return
        }
        try {
          var command = this.getCommandHandler(currentCommand);
          if (command && command.dialog) {
            var valid = (!command.dialog.validate) ? true : command.dialog.validate(this.currentCommand)
            if (valid===0) {
              this.restorePreview(true)
              return
            }

            if (currentCommand.preview && (currentCommand.preview.type)) {

              var expectedColumns = getProperty(currentCommand.preview.expectedColumns, [currentCommand]);

              if (expectedColumns == undefined) {
                if (currentCommand.output_cols && currentCommand.output_cols.length) {
                  expectedColumns = currentCommand.output_cols.length
                } else if (currentCommand.columns) {
                  expectedColumns = currentCommand.columns.length
                }
              }

              if (expectedColumns >= 0 && (currentCommand.output_cols || currentCommand.defaultOutputName)) {

                // column name optimization
                var nameMap = {}

                if (currentCommand.columns && currentCommand.output_cols) {
                  currentCommand.output_cols.forEach((col, i) => {
                    nameMap[ '__new__'+currentCommand.columns[i] ] = col
                  })
                }

                if (currentCommand.output_col && currentCommand.defaultOutputName) {
                  nameMap[currentCommand.defaultOutputName] = currentCommand.output_col
                }

                this.$store.commit('setPreviewNames',nameMap)
                var newColumns = 0
                var replacingColumns = 0
                if (currentCommand.preview.multipleOutputs) {
                  newColumns = +expectedColumns;
                } else {
                  for (const key in nameMap) {
                    if (nameMap[key] && '__new__'+nameMap[key]!==key) {
                      newColumns++
                    } else if (!nameMap[key] || '__new__'+nameMap[key]===key){
                      replacingColumns++
                    }
                  }
                }
                if (currentCommand.defaultOutputName && !newColumns) {
                  newColumns = 1
                }
                this.$store.commit('setPreviewInfo', {newColumns, replacingColumns})
              }

              this.preparePreviewCode(expectedColumns);
            }

            if (currentCommand.preview && currentCommand.preview.fake==='rename') {
              var nameMap = {}
              currentCommand.output_cols.forEach((col, i) => {
                nameMap[currentCommand.columns[i]] = col
              })
              this.$store.commit('setPreviewNames',nameMap)
            } else if (currentCommand.preview && currentCommand.preview.fake==='duplicate') {
              var duplicatedColumns = []
              currentCommand.output_cols.forEach((col, i) => {
                duplicatedColumns.push({name: currentCommand.columns[i], newName: col})
              })
              this.$store.commit('setDuplicatedColumns',duplicatedColumns.length ? duplicatedColumns : undefined)
              this.$store.commit('setPreviewInfo', {newColumns: duplicatedColumns.length || false})
            }
          } else {
            this.restorePreview(false)
          }
        } catch (error) {
          console.error(error)
        }
      }
    },

    currentDataset: {
      deep: true,
      handler () {
        if (this.commandsDisabled===undefined) {
          this.commandsDisabled = false;
        }
      }
    },

  },

  methods: {

    fromForm (form) {
      return this.$refs.formDialog.fromForm(form)
    },

    async selectMacroSources (length, sources) {

      let fields = [];
      for (let i = 0; i < length; i++) {
        
        let label;
        if (length == 1) {
          label = 'Source';
        } else {
          label = 'Source ' + (i + 1);
        }

        fields.push({
          key: i,
          is: 'v-select',
          name: '',
          value: sources[i],
          props: {
            placeholder: undefined,
            label,
            items: sources
          }
        });
      }

      let values = await this.fromForm({
        text: 'Select sources',
        fields
      });

      if (!values) {
        return false;
      }

      return Object.entries(values).sort((a, b) => a[0] - b[0]).map(e => e[1]);
    },

    async runMacro (payload) {

      let macro = payload.macro;

      let macroSourcesLength = macro.sourcesLength - macro.newSources.length;

      let cellsSources = this.cells
        .filter(cell => cell?.payload?.request?.createsNew)
        .map(cell => cell?.payload?.newDfName);

      cellsSources = [...new Set(cellsSources)];

      let selectedSources = [];

      if (macroSourcesLength == 1 && cellsSources.length == 1) {
        selectedSources = cellsSources;
      } else if (macroSourcesLength > 0) {
        selectedSources = await this.selectMacroSources(macroSourcesLength, cellsSources);
        if (!selectedSources) {
          return;
        }
      }

      let sources = [];

      let allSourcesLength = Math.max(macro.sourcesLength, macro.newSourcesLength);

      for (let i = 0; i < allSourcesLength; i++) {
        if (!macro.newSources.includes(i) && selectedSources[0]) {
          sources[i] = selectedSources.shift();
        } else {
          sources[i] = this.getNewDfName(sources);
        }
      }

      for (let i = 0; i < macro.cells.length; i++) {
        const cell = macro.cells[i];
        macro.cells[i].payload = cell.payload || {};
        if (cell.sourceIndex !== undefined) {
          macro.cells[i].payload.dfName = sources[cell.sourceIndex];
        }
        if (cell.newSourceIndex !== undefined) {
          macro.cells[i].payload.newDfName = sources[cell.newSourceIndex];
        }        
      }

      for (let i = 0; i < macro.cells.length; i++) {
        const cell = macro.cells[i];
        let noCall = (i != macro.cells.length - 1);
        let cellToAdd = {
          ...cell,
          ...cell.payload,
          columns: cell.payload.columns || cell.columns
        };
        cellToAdd.payload = cell.payload;
        await this.addCell(-1, {
          ...cellToAdd,
          code: this.getCode(cellToAdd),
          content: this.getOperationContent(cellToAdd)
        }, false, noCall, noCall);
      }
    },

    async saveMacro () {

      try {

        let date = new Date();

        let name = "macro-"+this.$route.params.slug+"-"+date.getFullYear()+"-"+(date.getMonth() + 1)+"-"+date.getDate()+"-"+date.getHours()+"-"+date.getMinutes()+"-"+date.getSeconds();

        let values = await this.fromForm({
          text: 'Save macro',
          acceptLabel: 'Save',
          fields: [{
            key: 'name',
            name: '',
            value: name,
            props: {
              placeholder: name,
              label: 'Macro name'
            }
          }]
        });

        if (!values) {
          return false;
        }

        if (values.name) {
          name = values.name;
        }

        let cellsToMacro = deepCopy(this.selectedCells.map(index => this.cells[index]));
        let sources = []
        let newSources = []
        
        // sources
  
        for (let i = 0; i < cellsToMacro.length; i++) {

          const cell = cellsToMacro[i];
  
          if (cell?.payload?.dfName) {
  
            let sourceIndex;
  
            sourceIndex = sources.indexOf(cell.payload.dfName);
            
            if (sourceIndex == -1) {
              sources.push(cell.payload.dfName);
              sourceIndex = sources.length - 1;
            }
  
            cellsToMacro[i].sourceIndex = sourceIndex;
          }
  
        }

        // new sources and cleanup
  
        for (let i = 0; i < cellsToMacro.length; i++) {
  
          const cell = cellsToMacro[i];
  
          if (cell?.payload?.request?.createsNew && cell?.payload?.newDfName) {
  
            let newSourceIndex;

            let newDfName = cell.payload.newDfName;
  
            newSourceIndex = sources.indexOf(newDfName);
            
            if (!newSources.includes(newDfName)) {
              newSources.push(newDfName);
            }

            if (newSourceIndex == -1) {
              sources.push(newDfName);
              newSourceIndex = sources.length - 1;
            }
  
            cellsToMacro[i].newSourceIndex = newSourceIndex;
          }
  
          delete cellsToMacro[i].code;
          delete cellsToMacro[i].content;
          delete cellsToMacro[i].created;
          delete cellsToMacro[i].modified;
          delete cellsToMacro[i].done;
          delete cellsToMacro[i].error;
          
          delete cellsToMacro[i].payload.dfName;
          delete cellsToMacro[i].payload.workspace_name;
          delete cellsToMacro[i].payload.allColumns;
          delete cellsToMacro[i].payload.allColumnDateFormats;
          delete cellsToMacro[i].payload.columnDateFormats;
          delete cellsToMacro[i].payload.columnDateTypes;
          delete cellsToMacro[i].payload.secondaryDatasets;
          delete cellsToMacro[i].payload.newDfName;
        }
  
        let payload = {
          name,
          macro: {
            cells: cellsToMacro,
            newSources: newSources.map(source => sources.indexOf(source)),
            newSourcesLength: newSources.length,
            sourcesLength: sources.length
          }
        };

        var response = await this.$store.dispatch('request',{
          request: 'post',
          path: `/macros`,
          payload
        });

        this.clearCellsSelection();        
        
      } catch (error) {
        console.error(error)
      }

    },
    
    async showCodeOnTextDialog (engineText) {

      var finalPayload = await this.$store.dispatch('finalCommands', { ignoreFrom: -1, include: [], noPandas: true });

      var code = 'from optimus import Optimus\n'
      +'from optimus.expressions import parse\n'
      +`op = Optimus(${engineText})\n`
      + generateCode(finalPayload)[0];

      code = code.trim();

      this.showTextDialog(code, 'Code')
    },

    clickCopy(value, event) {
      this.copied = true;
      copyToClipboard(value, event.target);
      event.target.focus();
      setTimeout(() => {
        this.copied = false;
      }, 2000);
    },

    setPreviewError: debounce( function (error) {
      this.previewError = error
    }, 750),

    getNewDfName (datasets) {

      var name = 'df';

      var sd = [...Array.from(this.secondaryDatasets), ...(datasets || [])]
        .filter(e=>e.startsWith(name));
      sd.sort((a,b)=>{
        return parseInt(a.replace(name, '')) - parseInt(b.replace(name, ''));
      });

      if (sd.length) {
        var i = (parseInt(sd[sd.length-1].replace(name, '')) || 0)+1;
        if (i) {
          name = name+i;
        }
      }

      return name;
    },

    runCells (forceAll, ignoreFrom, beforeRunCells) {
      var payload = { forceAll, ignoreFrom, socketPost: this.socketPost, clearPrevious: true, beforeRunCells, methods: this.commandMethods };
      return this.$store.dispatch('getCellsResult', { forcePromise: true, payload });
    },

    forceFileDownload(url, filename){
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename); //or any other extension
      link.download = filename;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
    },

    showTextDialog(text, title = 'Result') {
      this.textDialog = { text, title };
    },

    async compileDataset () {
      try {
        await this.cancelCommand();
        var payload = await this.$store.dispatch('finalCommands', { ignoreFrom: -1, include: [{
          command: 'compile',
          dfName: this.currentDataset.dfName,
          request: {
            noSave: true,
            type: 'final'
          }
        }] });

        var response = await this.evalCode(payload, 'await', 'requirement')

        var result = response.data.result.replace(/\\n/g,'\n')

        this.showTextDialog(result)
      } catch (error) {
        console.error(error)
      }
    },

    async downloadResult (include) {
      try {
        await this.cancelCommand();
        var payload = await this.$store.dispatch('finalCommands', { ignoreFrom: -1, include });

        var response = await this.evalCode(payload, 'await', 'requirement')

        var result = response.data.result.replace(/\\n/g,'\n')

        this.showTextDialog(result)
      } catch (error) {
        console.error(error)
      }
    },

    async runCell (cell) {
      try {
        await this.cancelCommand();
        await this.runCodeNow();
        var response = await this.evalCode(cell, 'await', 'requirement');
        console.debug("[DEBUG] Operation done", response);
      } catch (error) {
        console.error(error)
      }
    },
  
    async downloadDatasetRerun () {
      try {
        await this.cancelCommand();
        var include = [{
          command: 'Download',
          dfName: this.currentDataset.dfName,
          username: this.currentUsername,
          workspace: this.$route.params.slug,
          request: {}
        }];
        var payload = await this.$store.dispatch('finalCommands', { ignoreFrom: -1, include });
        var response = await this.evalCode(payload, 'await', 'after_update');
        this.forceFileDownload(response.data.result.download_url);
      } catch (error) {
        console.error(error)
      }
    },

    async downloadDataset () {
      try {
        await this.cancelCommand();
        await this.runCodeNow();
        var payload = {
          command: 'Download',
          dfName: this.currentDataset.dfName,
          username: this.currentUsername,
          workspace: this.$route.params.slug
        };
        var response = await this.evalCode(payload, 'await', 'after_update');
        this.forceFileDownload(response.data.result.download_url);
      } catch (error) {
        console.error(error);
      }
    },

    restorePreview (restoreColumns) {
      if (restoreColumns) {
        // Restores everything including previewCode
        this.$store.commit('previewDefault')
      } else if (this.previewCode) {
        this.$store.commit('setPreviewCode', undefined)
      }
    },

    clearTextSelection () {

      if (window.getSelection) {
        window.getSelection().removeAllRanges()
      }
      else if (document.selection) {
        document.selection.empty()
      }

      if (this.selectionType==='text') {
        this.$store.commit('selection',{ clear: true })
        return
      }

    },

    clearSelection () {

      if (window.getSelection) {
        window.getSelection().removeAllRanges();
      }
      else if (document.selection) {
        document.selection.empty();
      }

      this.$store.commit('selection',{ clear: true });
    },

    recoverTextSelection () {

      this.$nextTick(()=>{
        try {
          window.getSelection().removeAllRanges()
          window.getSelection().addRange(this.currentSelection.text.selection)
        } catch (error) {}
      })

    },

    getProperty,

    async undoCells () {
      try {
        await this.$store.dispatch('undoCells');
        await this.$store.dispatch('resetPromises', { from: 'cells', error: false });
        await this.$nextTick();
        await this.$store.dispatch('getProfiling', { payload: {
          socketPost: this.socketPost,
          dfName: this.currentDataset.dfName,
          avoidReload: true,
          clearPrevious: true,
          preliminary: true,
          methods: this.commandMethods
        }});
      } catch (err) {
        await this.$store.dispatch('undoCells', true);
        console.error(err);
      }
    },

    async removeErrorAlert (id) {
      let cells = this.$store.state.cells
      this.$store.commit('removeErrorAlert', id);
      if (cells.error && cells.error == id && !this.firstRun) {
        await this.undoCells();
      }
    },

    preparePreviewCode: debounce( async function(expectedColumns) {

      try {

        let commandHandler = this.command;

        let preview = this.currentCommand.preview || {};

        this.$store.commit('setPreviewCode',{
          code: this.getCode(this.currentCommand, 'preview'),
          codePayload: deepCopy(this.currentCommand),
          beforeCodeEval: this.currentCommand.beforeCodeEval ? ()=>this.currentCommand.beforeCodeEval(this.currentCommand) : false,
          color: getProperty(preview.highlightColor, [this.currentCommand]),
          from: this.currentCommand.columns,
          latePreview: !!getProperty(preview.latePreview, [this.currentCommand]),
          datasetPreview: !!getProperty(preview.datasetPreview, [this.currentCommand]),
          loadPreview: !!getProperty(preview.loadPreview, [this.currentCommand]),
          load: preview.type==='load',
          infer: this.currentCommand._moreOptions===false, // TO-DO: Check
          noBufferWindow: getProperty(preview.noBufferWindow, [this.currentCommand]),
          lessRows: getProperty(preview.lessRows, [this.currentCommand]),
          joinPreview: getProperty(preview.joinPreview, [this.currentCommand]),
          expectedColumns,
        })

      } catch (err) {
        console.error(err) // probably just a cancelled request
      }


    }, 250),

    getCommandTitle() {
      try {
        return getProperty(this.command.dialog.title || this.currentCommand.title || this.command.dialog.text || this.currentCommand.text, [this.currentCommand])
      }
      catch (err) {
        return 'Operation'
      }
    },

    getCommandHandler (command) {

      var commandHandler = commandsHandlers[command.command] || commandsHandlers[command.generator];

      if (!commandHandler) {
        commandHandler = deepCopy(this.customCommandsHandlers[command.command] || this.customCommandsHandlers[command.generator]);
      }

      return commandHandler;

    },

    filterCells (newOnly = false, ignoreFrom = -1) {
      filterCells(this.cells, newOnly, ignoreFrom)
    },

    codeText (newOnly, ignoreFrom) {
      return this.$store.dispatch('codeText', {newOnly, ignoreFrom});
    },

    beforeRunCells (newOnly = false, ignoreFrom = -1) {
      return this.$store.dispatch('beforeRunCells', {newOnly, ignoreFrom, methods: this.commandMethods});
    },

    async commandHandle (command) {

      let previousPayload = command.payload || {};

      await this.cancelCommand(false);

      if (!command || command.empty) {
        this.runCodeNow()
        return
      }

      if (this.selectionType!=='text') {
        this.clearTextSelection()
      }

      this.$store.commit('setPreviewColumns',false)

      var columns = command.columns || previousPayload.columns;
      var columnDataTypes = undefined;
      var columnDateFormats = undefined;

      if (!columns || !columns.length) {
        columns = this.columns.map(e=>this.currentDataset.columns[e.index].name)
        columnDataTypes = this.columns.map(e=>this.currentDataset.columns[e.index].stats.inferred_data_type.data_type)
        columnDateFormats = this.columns.map(e=>transformDateFromPython(this.currentDataset.columns[e.index].stats.inferred_data_type.format)).filter(e=>e);
      } else {
        var columnIndices = namesToIndices(columns, this.currentDataset.columns)
        columnDataTypes = columnIndices.map(i=>this.currentDataset.columns[i].stats.inferred_data_type.data_type)
        columnDateFormats = columnIndices.map(i=>transformDateFromPython(this.currentDataset.columns[i].stats.inferred_data_type.format)).filter(e=>e);
      }

      var allColumnDateFormats = this.allColumns.map((e,i)=>transformDateFromPython(this.currentDataset.columns[i]?.stats?.inferred_data_type?.format)).filter(e=>e);

      // default payload

      var secondaryDatasets = {};

      for (let i = 0; i < this.secondaryDatasets.length; i++) {
        const dfName = this.secondaryDatasets[i];
        secondaryDatasets[dfName] = {};
      }

      var payload = {
        ...previousPayload,
        request: {
          engine: (this.$store.state.localEngineParameters || {}).engine,
          isLoad: false,
          createsNew: false,
          noOperations: command.noOperations,
          immediate: command.immediate,
          retry: 0, /* amount of retries for a failed preview request, used in Join operation */
          isString: columnDataTypes && columnDataTypes.every(d=>STRING_TYPES.includes(d)),
        },
        secondaryDatasets,
        columnDataTypes: columnDataTypes,
        columnDateFormats: columnDateFormats,
        allColumnDateFormats: allColumnDateFormats,
        dfName: previousPayload.dfName || this.currentDataset.dfName,
        newDfName: previousPayload.newDfName ||this.getNewDfName(),
        allColumns: this.allColumns,
        workspace_name: this.$route.params.slug,
        query: this.$route.query,
        type: command.type,
        generator: command.generator || previousPayload.generator,
        command: command.command || previousPayload.command,
      }

      var commandHandler = this.getCommandHandler(payload)

      if (commandHandler) {

        // default payload from commandHandler

        if (commandHandler.payload) {
          var newPayload = await commandHandler.payload(columns, payload)
          payload = {
            ...payload,
            ...newPayload,
            request: {
              ...payload.request,
              ...newPayload.request
            },
            preview: {
              ...payload.preview,
              ...newPayload.preview
            }
          }
        }

        // payload from params

        payload = {
          ...payload,
          ...(previousPayload || {})
        }

        delete payload.query;

        if (commandHandler.dialog) {

          this.currentCommand = payload

          this.$emit('updateOperations', { active: true, title: this.getCommandTitle() })
          this.$emit('update:big',commandHandler.dialog.big)

          if (commandHandler.onInit) {
            this.currentCommand = await commandHandler.onInit({}, this.currentCommand, this.commandMethods)
          }

          if (command.execute) {
            for (let i = 0; i < command.execute.length; i++) {
              const element = command.execute[i];
              if (commandHandler[element]) {
                await commandHandler[element](this.currentCommand)
              }
            }
          }

          if (command.immediate) {
            await this.confirmCommand()
          } else {
            setTimeout(() => {
              var ref = this.$refs['operation-form'] && this.$refs['operation-form'][0]
              if (ref && ref.$el) {
                var el = ref.$el.getElementsByTagName('input')[0]
                if (el)
                  el.focus()
              }
            }, 100);
          }
        } else {

          var cell = {
            ...command,
            ...payload,
            columns: payload.columns || columns
          }

          if (cell.request.toCell === false) {
            await this.runCell(cell);
          } else {
            await this.addCell(-1, {
              ...cell,
              code: this.getCode(cell),
              content: this.getOperationContent(cell)
            });
          }

          this.clearTextSelection()
        }
      } else {
        console.warn('Invalid command', {command: payload.command, generator: payload.generator})
      }
    },

    async confirmCommand (event) {

      let command = deepCopy(this.currentCommand)
      this.currentCommand = false;

      this.gettingNewResults = 'hide';
      this.$store.commit('mutation', {mutate: 'updatingDataset', payload: true });

      if (this.currentPreviewInfo) {
        if (this.currentPreviewInfo.newColumns>0) {
          this.gettingNewResults = 'nohide';
        }
      }

      this.isEditing = false;
      this.clearTextSelection();
      this.clearSelection();
      var commandHandler = this.getCommandHandler(command);

      if (command._custom) {
        command._generator = this.$store.state.customCommands.generators[command.command]
        command._custom = this.$store.getters['customCommands/genericCommandPayload'];
      }

      if (command._output == 'plain-text') {
        var payload = getCodePayload(command);
        payload.request = command.request || {};
        this.downloadResult([{ payload }])
        this.$store.commit('mutation', {mutate: 'updatingDataset', payload: false });
        return true;
      }

      if (commandHandler.onDone) {
        command = await commandHandler.onDone(command);
      }

      var code = this.getCode(command);
      var content = this.getOperationContent(command);

      var toCell = command._toCell!==undefined ? command._toCell : -1;

      this.$emit('updateOperations', { active: ((command.request && command.request.noOperations) ? false : true), title: 'operations' } );

      if (command.request.toCell === false) {
        await this.runCell(command);
      } else {
        await this.addCell(toCell, { ...command, code, content }, true, true );
      }

      if (command.request.createsNew) {
        let dfName = command.newDfName;
        console.log("Create new tab", dfName);
        this.$store.commit('setDfToTab', { dfName, go: true });
        await this.$store.dispatch('getProfiling', { payload: { dfName, socketPost: this.socketPost, preliminary: true, methods: this.commandMethods } });
        this.$store.commit('setDfToTab', { dfName, go: true });
      }

      this.$store.commit('mutation', {mutate: 'updatingDataset', payload: false });
    },

    async cancelCommand (runCode = true) {
      this.$store.commit('mutation', {mutate: 'updatingDataset', payload: true });
      await new Promise((resolve, reject)=>{
        setTimeout(async () => {
          // this.recoverTextSelection();
          // this.clearSelection();
          this.currentCommand = false;
          this.$emit('updateOperations', {
            active: false,
            title: 'operations'
          });
          this.$store.commit('previewDefault');
          if (runCode) {
            if (this.isEditing) {
              await this.runCodeNow(true, -1, undefined, false, true)
            } else {
              await this.runCodeNow(false);
            }
          }
          if (this.isEditing && runCode) {
            this.isEditing = false;
          }
          this.$nextTick(()=>{
            resolve(true);
          });
        }, 10);
      });
      this.$store.commit('mutation', {mutate: 'updatingDataset', payload: false });
    },

    draggableStart () {
      window.dragType = 'cell'
      this.drag = true
    },

    async draggableEnd (noDrag = false) {
      this.drag = false
      if (window.dragType == 'cell' || noDrag) {
        this.localTransformations = this.localTransformations
        this.localDataSources = this.localDataSources
        var codeText = await this.codeText();
        if (codeText.trim()==='') {
          this.removeErrorAlert("all")
          this.runCode() // deleting every cell
          return;
        }
        this.runCode() // reordering or deleting
        return;
      }
    },

    async removeCells() {
      let dataSourcesCells = this.selectedCells.filter(i => i<this.dataSources.length);
      let transformationsCells = this.selectedCells.filter(i => i>=this.dataSources.length).map(i => i-this.dataSources.length);
      for (let i = transformationsCells.length - 1; i >= 0; i--) {
        await this.removeCell(transformationsCells[i], false);
      }
      for (let i = dataSourcesCells.length - 1; i >= 0; i--) {
        await this.removeCell(dataSourcesCells[i], true);
      }
      this.clearCellsSelection();
    },

    async removeCell (index, isDataSource = false) {

      let from = isDataSource ? this.localDataSources : this.localTransformations

      if (index<0 || !from[index]) {
        return
      }

      let currentPayload = from[index].payload

      if (currentPayload.request && currentPayload.request.createsNew) {
        let filteredCells = this.cells.filter(cell => cell.payload.dfName===currentPayload.newDfName && !cell.payload.request.createsNew)
        if (filteredCells.length>0) {
          console.warn('[CELLS] Cannot remove, there are cells using this created dataset as source')
          return
        }
      }

      this.removeErrorAlert("all")

      let cells = [...from]
      let deletedPayload = cells.splice(index,1)[0].payload

      let deleteTab = false

      if (deletedPayload.request && deletedPayload.request.createsNew) {
        let dfName = deletedPayload.newDfName
        if (dfName) {
          deleteTab = currentPayload.newDfName
          await this.evalCode({
            command: 'delete',
            dfName
          }, 'await', 'after_update');
        }
      }

      if (deleteTab) {
        let foundTab = this.$store.state.datasets.findIndex(dataset => dataset.dfName === deleteTab);
        if (foundTab>=0) {
          await this.$store.dispatch('newDataset', { dfName: deleteTab });
        }
      }

      if (isDataSource) {
        this.localDataSources = cells;
      } else {
        this.localTransformations = cells;
      }

      this.codeDone = '';
      this.draggableEnd(true);
    },

    async deleteCellsError (ignoreFrom = -1) {
      await this.$store.dispatch('markCells', { ignoreFrom, splice: true, last: true });
    },

    async markCells (mark, ignoreFrom) {
      await this.$store.dispatch('markCells', { mark, ignoreFrom });
    },

    async markCellsError (ignoreFrom = -1) {
      await this.$store.dispatch('markCells', { ignoreFrom, error: true, last: true });
    },

    getOperationContent (payload) {

      var commandHandler = this.getCommandHandler(payload)
      var content

      if (!commandHandler || !commandHandler.content) {
        content = this.getCode(payload)
      } else {
        content = commandHandler.content(payload)
      }

      if (payload.request && payload.request.createsNew) {
        content += `<span class="hint--df"> to ${hlParam(payload.newDfName)}</span>`
      } else if (!payload.request || !payload.request.isSave) {
        content += `<span class="hint--df"> in ${hlParam(payload.dfName)}</span>`
      }

      return content
    },

    getCode (currentCommand, type = 'processing') {

      var payload = { ...currentCommand };

      if (!payload.columns || !payload.columns.length) {
        payload.columns = this.columns.map(e=>this.currentDataset.columns[e.index].name);
      }

      var request = {
        type,
        dfName: this.currentDataset.dfName,
        _isReference: true
      }

      return generateCode({command: payload.command, payload}, request)[0];

    },

    clearCellsSelection () {
      this.cellsSelection = {};
    },

    selectCell (index) {
      let cellsSelection = deepCopy(this.cellsSelection || {});
      cellsSelection[index] = !cellsSelection[index];
      this.cellsSelection = cellsSelection;
    },

    async editCell (index) {

      if (index == -1) {
        index = undefined;
      }

      if (index === undefined && this.selectedCells.length) {
        index = this.selectedCells[0];
        this.clearCellsSelection();
      }

      if (index === undefined || !this.cells[index]) {
        console.error("Trying to edit unexisting cell with index", index, this.cellsSelection);
        return;
      }

      var cell = deepCopy(this.cells[index]);

      var commandHandler = this.getCommandHandler(cell.payload || cell);

      // console.debug('[DEBUG] Editing cell',{cell, index, commandHandler})

      if (cell?.payload?._custom) {
        cell.payload._generator = this.$store.state.customCommands.generators[cell.payload.command]
        cell.payload._custom = this.$store.getters['customCommands/genericCommandPayload'];
      }

      if (!commandHandler?.dialog) {
        console.error('Cannot edit', _cell);
      } else {
        this.$store.commit('selection',{ clear: true })
        this.commandsDisabled = true;
        this.isEditing = true;
        cell.payload._toCell = index;
        await this.runCodeNow(true, index, undefined, false, false)
        let afterProfile = () => {
          this.commandsDisabled = false;
          this.commandHandle(cell);
        };
        this.$store.commit('mutation', { mutate: 'afterProfileCallback', payload: afterProfile });
      }
    },

    async addCell (at = -1, payload = {command: 'code', code: '', content: '', ignoreCell: false, noCall: false, deleteOtherCells: false}, replace = false, forceAll = false, noCall = false) {

      var {command, code, ignoreCell, deleteOtherCells, content} = payload;

      if (payload._custom) {
        code = this.getCode(payload)
      }

      this.removeErrorAlert("all")

      if (at==-1) {
        at = this.cells.length
        replace = false
      }

      var cells = [...this.cells]

      if (deleteOtherCells) {
        for (let i = cells.length - 1; i >=0 ; i--) {
          if (cells[i].command===command) {
            cells.splice(i, 1)
          }
        }
      }

      delete payload.deleteOtherCells

      cells.splice(at, +replace, {
        payload: payload,
        type: payload.type,
        command,
        code: code,
        content: content,
        id: Number(new Date()),
        ignore: ignoreCell,
        created: new Date(),
        modified: new Date()
      });

      this.cells = cells

      if (!payload.noCall && this.cells.length && !noCall) {
        return this.runCodeNow(forceAll, -1, payload.newDfName);
      }

    },

    async runCodeNow (forceAll = false, ignoreFrom = -1, newDfName, runCodeAgain = true, beforeRunCells = true) {

      let cellsResult;

      try {
        let dfName = (this.currentDataset ? this.currentDataset.dfName : undefined) || newDfName;

        cellsResult = await this.runCells(forceAll, ignoreFrom, beforeRunCells);

        if (!cellsResult) {
          return false;
        }
        
        this.$store.commit('previewDefault');

        // let partial = true;

        let profilingResponse = await this.$store.dispatch('getProfiling', { payload: { dfName, ignoreFrom, clearPrevious: true, socketPost: this.socketPost, preliminary: true, methods: this.commandMethods } });

        if (this.firstRun) {
          this.firstRun = false;
        }

        this.$forceUpdate();

        await this.markCells(true, ignoreFrom);
        await this.removeErrorAlert("all");

        this.lastWrongCode = false;

        this.$emit("checkSample");


      } catch (err) {
        if (!runCodeAgain) {
          throw err;
        }
        console.error('Error running code, trying again', err);
      }

      if (runCodeAgain) {
        let codeText = await this.codeText();

        let code = cellsResult ? cellsResult.originalCode : undefined;

        if (codeText !== code) {
          setTimeout(() => {
            this.runCodeNow(false, ignoreFrom, newDfName, false);
          }, 50);
        }
      }

      return !this.lastWrongCode;

    },

    runCode: debounce( async function (forceAll = false) {
      await this.runCodeNow(forceAll)
    }, 250),
  }
}
</script>
