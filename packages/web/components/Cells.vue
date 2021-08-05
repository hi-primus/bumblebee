<template>
  <div class="sidebar-content">
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
              <template v-slot:activator>
                <v-icon small @click.stop="clickCopy(textDialog.text, $event)">content_copy</v-icon>
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
          <div class="body-2 mb-1 mt-2" :class="{'title': command.dialog.bigText}" v-if="command.dialog.text">
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
            <template  v-if="command.dialog.output_cols">
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
                  :currentCommand="currentCommand"
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
                        :currentCommand="currentCommand"
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

            <template>
              <v-alert key="error" type="error" class="mt-0" dismissible v-if="currentCommand.error"  @input="currentCommand.error=''">
                {{currentCommand.error}}
              </v-alert>
            </template>
          </div>
          <div
            class="o-results pb-2"
            v-if="currentPreviewInfo && (currentPreviewInfo.rowHighlights || currentPreviewInfo.newColumns || currentPreviewInfo.replacingColumns)">
            <template
              v-if="typeof currentPreviewInfo.rowHighlights=='number'"
            >
              <div
                :class="{'warning--text': !currentPreviewInfo.rowHighlights}"
                class="text--darken-2"
               >
                Matching rows: {{currentPreviewInfo.rowHighlights}}
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
              @click="cancelCommand"
            >
              Cancel
            </v-btn>
            <v-btn
              color="primary"
              id="btn-command-submit"
              depressed
              dense
              :disabled="(command.dialog.validate && !command.dialog.validate(currentCommand)) || (storePreviewError && !allowError)"
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
        :class="{ 'no-pe disabled': commandsDisabled, 'dragging': drag }"
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
          :class="{'fixed-cell': cell.fixed, 'cell-error': cell.error,'done': cell.done}"
        >
          <div class="cell">
            <div class="handle left-handle">
              <v-icon>drag_indicator</v-icon>
            </div>
            <div
              class="handle operation-hint-text"
              :class="{'multiple-tabs': hasSecondaryDatasets}"
              @click="editCell(cell, index)"
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
        :class="{ 'no-pe disabled': commandsDisabled, 'dragging': drag }"
        :list="localCommands"
        v-bind="commandsDragOptions"
        handle=".handle"
        @start="draggableStart"
        @end="draggableEnd(false)"
      >
        <div
          class="cell-container"
          v-for="(cell, index) in localCommands"
          :key="cell.id"
          :class="{'fixed-cell': cell.fixed, 'cell-error': cell.error,'done': cell.done}"
        >
          <div class="cell">
            <div class="handle left-handle">
              <v-icon>drag_indicator</v-icon>
            </div>
            <div
              class="handle operation-hint-text"
              :class="{'multiple-tabs': hasSecondaryDatasets}"
              @click="editCell(cell, index+dataSources.length)"
              v-html="cell.content || cell.code"
            >
            </div>
            <v-icon
              class="right-cell-btn"
              small
              @click="removeCell(index, false)"
            >close</v-icon>
          </div>
        </div>
      </draggable>
      <v-alert key="error" type="error" class="mt-3" dismissible v-if="codeError!=''"  @input="cleanCodeError">
        {{codeError}}
      </v-alert>
    </div>
  </div>
</template>

<script>

import CodeEditor from '@/components/CodeEditor'
import CommandFormContainer from '@/components/CommandFormContainer'
import OutputColumnInputs from '@/components/OutputColumnInputs'
import Outliers from '@/components/Outliers'
import OperationField from '@/components/OperationField'
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
  STRING_TYPES
} from 'bumblebee-utils'

import { commandsHandlers } from '@/utils/operations'

export default {

  components: {
    CommandFormContainer,
    CodeEditor,
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

      previewError: false,

      textDialog: false,
      copied: false,

      clusterHeaders: [
        { text: 'Rows', value: 'count', sortable: false, class: 'rows-count' },
        { text: 'Values', value: 'value', sortable: false }
      ],

      barTop: 0,
      barHovered: false,

      activeCell: -1,
      drag: false,
      currentCommand: false,
      isEditing: false,

      cellsPromise: false

    }
  },

  computed: {

    ...mapGetters([
      'dataSources',
      'commands',
      'workspaceCells',
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

    customCommandsHandlers () {
      return this.$store.getters['customCommands/handlers'];
    },

    codeError: {
      get () {
        return this.$store.state.codeError;
      },
      set (value) {
        this.$store.commit('mutation', {mutate: 'codeError', payload: value})
      }
    },

    gettingNewResults: {
      get () {
        return this.$store.state.gettingNewResults;
      },
      set (value) {
        this.$store.commit('mutation', {mutate: 'gettingNewResults', payload: value})
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
        this.$store.commit('mutation', {mutate: 'codeDone', payload: value})
      }
    },

    localCommands: {
      deep: true,
      get () {
        return Array.from(this.commands)
      },
      set (commands) {
        this.$store.dispatch('mutateAndSave', {mutate: 'commands', payload: commands} )
      }
    },

    localDataSources: {
      deep: true,
      get () {
        return Array.from(this.dataSources)
      },
      set (dataSources) {
        this.$store.dispatch('mutateAndSave', {mutate: 'dataSources', payload: dataSources} )
      }
    },

    cells: {
      get () {
        return [...this.localDataSources, ...this.localCommands]
      },
      set (value) {
        this.localCommands = value.filter(e=>!(e && e.payload && e.payload.request && e.payload.request.isLoad))
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
        this.$store.commit('mutation', {mutate: 'commandsDisabled', payload: value})
      }
    },

  },

  mounted () {
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
            if (meta.sheet_names.length && !meta.sheet_names.includes(c.sheet_name)) {
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

              var expectedColumns;

              if (currentCommand.preview.expectedColumns!==undefined) {
                expectedColumns = getProperty(currentCommand.preview.expectedColumns, [currentCommand])
              } else if (currentCommand.output_cols && currentCommand.output_cols.length) {
                expectedColumns = currentCommand.output_cols.length
              } else if (currentCommand.columns) {
                expectedColumns = currentCommand.columns.length
              }

              if (currentCommand.output_cols || currentCommand.defaultOutputName) {

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
            if (currentCommand.preview.fake==='rename') {
              var nameMap = {}
              currentCommand.output_cols.forEach((col, i) => {
                nameMap[currentCommand.columns[i]] = col
              })
              this.$store.commit('setPreviewNames',nameMap)
            } else if (currentCommand.preview.fake==='duplicate') {
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

    getNewDfName () {

      var name = 'df'

      var sd = Array.from(this.secondaryDatasets)
        .filter(e=>e.startsWith(name))

      if (sd.length) {
        var i = (parseInt(sd[sd.length-1].split(name)[1]) || 0)+1
        if (i) {
          name = name+i
        }
      }

      return name
    },

    runCells (forceAll, ignoreFrom, beforeRunCells) {
      var payload = { forceAll, ignoreFrom, socketPost: this.socketPost, clearPrevious: true, beforeRunCells, methods: this.commandMethods };
      return this.$store.dispatch('getCellsResult', {forcePromise: true, payload });
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

        var response = await this.evalCode(payload)

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

        var response = await this.evalCode(payload)

        var result = response.data.result.replace(/\\n/g,'\n')

        this.showTextDialog(result)
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
        var response = await this.evalCode(payload);
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
        var response = await this.evalCode(payload);
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

    recoverTextSelection () {

      this.$nextTick(()=>{
        try {
          window.getSelection().removeAllRanges()
          window.getSelection().addRange(this.currentSelection.text.selection)
        } catch (error) {}
      })

    },

    getProperty,

    async cleanCodeError () {
      await this.$store.dispatch('deleteErrorCells');
      await this.$store.dispatch('resetPromises', { from: 'cells' });
      await this.$nextTick();
      await this.$store.dispatch('getProfiling', { payload: {
        socketPost: this.socketPost,
        dfName: this.currentDataset.dfName,
        avoidReload: true,
        clearPrevious: true,
        partial: true,
        methods: this.commandMethods
      }});
    },

    preparePreviewCode: debounce( async function(expectedColumns) {

      try {

        let commandHandler = this.command;

        let preview = this.currentCommand.preview || {};

        this.$store.commit('setPreviewCode',{
          code: this.getCode(this.currentCommand, 'preview'),
          profileCode: this.getCode(this.currentCommand, 'profile'),
          codePayload: deepCopy(this.currentCommand),
          beforeCodeEval: this.currentCommand.beforeCodeEval ? ()=>this.currentCommand.beforeCodeEval(this.currentCommand) : false,
          color: getProperty(preview.highlightColor, [this.currentCommand]),
          from: this.currentCommand.columns,
          datasetPreview: !!getProperty(preview.datasetPreview, [this.currentCommand]),
          loadPreview: !!getProperty(preview.loadPreview, [this.currentCommand]),
          load: preview.type==='load',
          infer: this.currentCommand._moreOptions===false, // TO-DO: Check
          noBufferWindow: getProperty(preview.noBufferWindow, [this.currentCommand]),
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

    clusterFieldUpdated(cluster) {
      if (cluster.selected.length==0) {
        cluster.selected = cluster.values
      }
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
        columnDataTypes = this.columns.map(e=>this.currentDataset.columns[e.index].stats.inferred_type.data_type)
        columnDateFormats = this.columns.map(e=>transformDateFromPython(this.currentDataset.columns[e.index].stats.inferred_type.format)).filter(e=>e);
      } else {
        var columnIndices = namesToIndices(columns, this.currentDataset.columns)
        columnDataTypes = columnIndices.map(i=>this.currentDataset.columns[i].stats.inferred_type.data_type)
        columnDateFormats = columnIndices.map(i=>transformDateFromPython(this.currentDataset.columns[i].stats.inferred_type.format)).filter(e=>e);
      }

      var allColumnDateFormats = this.allColumns.map((e,i)=>transformDateFromPython(this.currentDataset.columns[i].stats.inferred_type.format)).filter(e=>e);

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
          isString: columnDataTypes && columnDataTypes.every(d=>STRING_TYPES.includes(d)),
        },
        secondaryDatasets,
        columnDataTypes: columnDataTypes,
        columnDateFormats: columnDateFormats,
        allColumnDateFormats: allColumnDateFormats,
        dfName: previousPayload.dfName || this.currentDataset.dfName,
        newDfName: previousPayload.newDfName ||this.getNewDfName(),
        allColumns: this.allColumns,
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

        if (commandHandler.dialog) {

          this.currentCommand = payload

          this.$emit('updateOperations', { active: true, title: this.getCommandTitle() })
          this.$emit('update:big',commandHandler.dialog.big)

          if (commandHandler.onInit) {
            this.currentCommand = await commandHandler.onInit(this.currentCommand, [], this.commandMethods)
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
          await this.addCell(-1, {
            ...cell,
            code: this.getCode(cell),
            content: this.getOperationContent(cell)
          })

          this.clearTextSelection()
        }
      }
    },

    async confirmCommand (event) {

      this.gettingNewResults = 'hide';
      this.$store.commit('mutation', {mutate: 'loadingStatus', payload: 'Updating dataset' });

      if (this.currentPreviewInfo) {
        if (this.currentPreviewInfo.newColumns>0) {
          this.gettingNewResults = 'nohide';
        }
      }

      this.isEditing = false;
      this.clearTextSelection();
      var commandHandler = this.getCommandHandler(this.currentCommand);

      if (this.currentCommand._custom) {
        this.currentCommand._generator = this.$store.state.customCommands.generators[this.currentCommand.command]
        this.currentCommand._custom = this.$store.getters['customCommands/genericCommandPayload'];
      }

      if (this.currentCommand._output == 'plain-text') {
        var payload = getCodePayload(this.currentCommand);
        payload.request = this.currentCommand.request || {};
        this.downloadResult([{ payload }])
        return true;
      }

      if (commandHandler.onDone) {
        this.currentCommand = await commandHandler.onDone(this.currentCommand);
      }

      var code = this.getCode(this.currentCommand);
      var content = this.getOperationContent(this.currentCommand);

      var toCell = this.currentCommand._toCell!==undefined ? this.currentCommand._toCell : -1;

      await this.addCell(toCell, { ...this.currentCommand, code, content }, true );

      this.$emit('updateOperations', { active: ((this.currentCommand.request && this.currentCommand.request.noOperations) ? false : true), title: 'operations' } );
      this.currentCommand = false;
    },

    cancelCommand (runCode = true) {
      return new Promise((resolve, reject)=>{
        setTimeout(async () => {
          // this.recoverTextSelection();
          this.clearTextSelection();
          this.currentCommand = false;
          this.$emit('updateOperations', {
            active: false,
            title: 'operations'
          });
          this.$store.commit('previewDefault');
          if (runCode) {
            await this.runCodeNow(this.isEditing);
          }
          if (this.isEditing) {
            this.isEditing = false;
          }
          this.$nextTick(()=>{
            resolve(true);
          });
        }, 10);
      })
    },

    draggableStart () {
      window.dragType = 'cell'
      this.drag = true
    },

    async draggableEnd (noDrag = false) {
      this.drag = false
      if (window.dragType == 'cell' || noDrag) {
        this.localCommands = this.localCommands
        this.localDataSources = this.localDataSources
        var codeText = await this.codeText();
        if (codeText.trim()==='') {
          this.codeError = '';
          this.runCode() // deleting every cell
          return;
        }
        this.runCode() // reordering or deleting
        return;
      }
    },

    async removeCell (index, isDataSource = false) {

      let from = isDataSource ? this.localDataSources : this.localCommands

      if (index<0 || !from[index]) {
        return
      }

      let currentPayload = from[index].payload

      if (currentPayload.request && currentPayload.request.createsNew) {
        let filteredCells = this.cells.filter(cell => cell.payload.dfName===currentPayload.newDfName && !cell.payload.request.isLoad)
        if (filteredCells.length>0) {
          console.warn('[CELLS] Cannot remove, there are cells using this variable as input')
          return
        }
      }

      this.codeError = '';

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
          });
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
        this.localCommands = cells;
      }

      this.codeDone = '';
      this.draggableEnd(true);
    },

    async deleteCellsError (ignoreFrom = -1) {
      await this.$store.dispatch('markCells', { ignoreFrom, splice: true });
    },

    async markCells (mark, ignoreFrom) {
      await this.$store.dispatch('markCells', { mark, ignoreFrom });
    },

    async markCellsError (ignoreFrom = -1) {
      await this.$store.dispatch('markCells', { ignoreFrom, error: true });
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

    async editCell (_cell, index) {
      var cell = deepCopy(_cell);

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
        await this.runCodeNow(true, index, undefined, true, false)
        cell.payload._toCell = index
        setTimeout(() => {
          this.commandsDisabled = false;
          this.commandHandle(cell)
          this.isEditing = true

        }, 5000);
      }
    },

    async addCell (at = -1, payload = {command: 'code', code: '', content: '', ignoreCell: false, noCall: false, deleteOtherCells: false}, replace = false) {

      var {command, code, ignoreCell, deleteOtherCells, content} = payload;

      if (payload._custom) {
        code = this.getCode(payload)
      }

      this.codeError = '';

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
        ignore: ignoreCell
      })

      this.cells = cells

      if (!payload.noCall && this.cells.length) {
        return this.runCodeNow(false, -1, payload.newDfName);
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

        let dataset = await this.$store.dispatch('getProfiling', { payload: { dfName, ignoreFrom, clearPrevious: true, socketPost: this.socketPost, partial: true, methods: this.commandMethods } });

        this.$store.commit('previewDefault');

        if (this.firstRun) {
          this.firstRun = false;
        }

        this.$forceUpdate();

        this.markCells(true, ignoreFrom);

        this.codeError = '';
        this.lastWrongCode = false;

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
          }, 1000);
        }
      }

      return !this.lastWrongCode;

    },

    runCode: debounce( async function (forceAll = false) {
      await this.runCodeNow(forceAll)
    }, 1000),
  }
}
</script>
