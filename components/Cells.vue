<template>
  <div>
    <template name="command-dialogs">
      <template v-for="(command, key) in commandsPallete">
        <v-dialog :key="key" persistent v-if="command.dialog && currentCommand.command == key" :value="currentCommand.command == key" max-width="410" @click:outside="cancelCommand">
          <v-card>
            <v-card-title class="title mb-4">{{command.dialog.title()}}</v-card-title>
            <v-card-text class="command-card-text pb-0">
              <template v-for="field in command.dialog.fields">
                <template v-if="field.type=='number'">
                  <v-text-field
                    type="number"
                    v-model="currentCommand[field.key]"
                    :key="field.key"
                    :label="field.label"
                    :placeholder="field.placeholder"
                    :min="field.min"
                    dense
                    required
                    outlined
                  ></v-text-field>
                </template>
                <template v-else-if="field.type=='select'">
                  <v-select
                    :key="field.key"
                    v-model="currentCommand[field.key]"
                    :label="field.label"
                    :placeholder="field.placeholder"
                    :items="field.items"
                    dense
                    required
                    outlined
                  ></v-select>
                </template>
              </template>
              <OutputColumnInputs v-if="command.dialog.output_cols" :currentCommand.sync="currentCommand"></OutputColumnInputs>
            </v-card-text>
            <v-card-actions>
              <div class="flex-grow-1"/>
              <v-btn
                color="primary"
                text
                @click="cancelCommand"
              >
                Cancel
              </v-btn>
              <v-btn
                color="primary"
                text
                :disabled="!command.dialog.validate(currentCommand)"
                @click="confirmCommand()"
              >
                Accept
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </template>
      <v-dialog persistent v-if="currentCommand.command == 'create'" :value="currentCommand.command == 'create'" max-width="410" @click:outside="cancelCommand">
        <v-card>
          <v-card-title class="title mb-4">New column
            <template v-if="currentCommand.name">
              from {{ currentCommand.name }}
            </template>
          </v-card-title>
          <v-card-text class="command-card-text">
            <v-text-field
              v-model="currentCommand.newName"
              label="New column name"
              dense
              required
              outlined
            ></v-text-field>
          </v-card-text>
          <v-card-text v-if="currentCommand.expression!==false" class="pb-0 command-card-text">
            <v-text-field
              v-model="currentCommand.expression"
              label="Expression"
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
              @click="cancelCommand"
            >
              Cancel
            </v-btn>
            <v-btn
              color="primary"
              text
              :disabled="currentCommand.newName===''"
              @click="confirmCommand()"
            >
              Accept
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-dialog persistent v-if="currentCommand.command == 'rename'" :value="currentCommand.command == 'rename'" max-width="410" @click:outside="cancelCommand">
        <v-card>
          <v-card-title class="title mb-4">Rename {{ currentCommand.name }}</v-card-title>
          <v-card-text class="pb-0 command-card-text">
            <template v-for="column in currentCommand.renames">
              <v-text-field
                :key="column.name"
                v-model="column.newName"
                :label="column.name"
                dense
                required
                outlined
              ></v-text-field>
            </template>
          </v-card-text>
          <v-card-actions>
            <div class="flex-grow-1"/>
            <v-btn
              color="primary"
              text
              @click="cancelCommand"
            >
              Cancel
            </v-btn>
            <v-btn
              color="primary"
              text
              :disabled="(!currentCommand.renames.every( (e)=>{ return (e.newName.trim().length>0) } ))"
              @click="confirmCommand()"
            >
              Accept
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-dialog persistent v-if="currentCommand.command == 'duplicate'" :value="currentCommand.command == 'duplicate'" max-width="410" @click:outside="cancelCommand">
        <v-card>
					<v-card-title class="title mb-4">Duplicate {{ currentCommand.name }}</v-card-title>
          <v-card-text class="pb-0 command-card-text">
            <OutputColumnInputs :currentCommand.sync="currentCommand"></OutputColumnInputs>
          </v-card-text>
          <v-card-actions>
            <div class="flex-grow-1"/>
            <v-btn
              color="primary"
              text
              @click="cancelCommand"
            >
              Cancel
            </v-btn>
            <v-btn
              color="primary"
							:disabled="currentCommand.index>=currentCommand.splits || currentCommand.separator=='' || currentCommand.output_cols.filter(e=>e!=='').length%currentCommand.columns.length!==0"
              text
              @click="confirmCommand()"
            >
              Accept
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-dialog persistent v-if="currentCommand.command == 'nest'" :value="currentCommand.command == 'nest'" max-width="410" @click:outside="cancelCommand">
        <v-card>
          <v-card-title class="title">
            Nest columns
          </v-card-title>
          <v-card-text class="pb-0 command-card-text">
            <v-text-field
              class="mt-4"
              v-model="currentCommand.separator"
              label="Separator"
              dense
              required
              outlined
            ></v-text-field>
            <v-text-field
              v-model="currentCommand.newName"
              label="New column name"
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
              @click="cancelCommand"
            >
              Cancel
            </v-btn>
            <v-btn
              color="primary"
							:disabled="currentCommand.separator==='' || currentCommand.newName===''"
              text
              @click="confirmCommand()"
            >
              Accept
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-dialog persistent v-if="currentCommand.command == 'unnest'" :value="currentCommand.command == 'unnest'" max-width="410" @click:outside="cancelCommand">
        <v-card>
					<v-card-title class="title" v-if="currentCommand.columns.length==1">
            Unnest column
          </v-card-title>
          <v-card-title class="title" v-else>
            Unnest columns
          </v-card-title>
          <v-card-text class="pb-0 command-card-text">
            Unnest "{{ currentCommand.columns[0] }}"
            <v-text-field
              class="mt-4"
              v-model="currentCommand.separator"
              label="Separator"
              dense
              required
              outlined
            ></v-text-field>
						<v-text-field
              v-model="currentCommand.splits"
              label="Splits"
							type="number"
							min="2"
              clearable
              dense
              required
              outlined
            ></v-text-field>
						<v-text-field
              :value="(currentCommand.index>=0) ? currentCommand.index : ''"
              @input="currentCommand.index = ($event>=0) ? $event : ''"
              label="Index"
							type="number"
							class="mb-4"
							min="0"
              clearable
							:max="(currentCommand.splits!=='') ? currentCommand.splits-1 : undefined"
              dense
              required
              outlined
            ></v-text-field>
            <OutputColumnInputs :currentCommand.sync="currentCommand"></OutputColumnInputs>
          </v-card-text>
          <v-card-actions>
            <div class="flex-grow-1"/>
            <v-btn
              color="primary"
              text
              @click="cancelCommand"
            >
              Cancel
            </v-btn>
            <v-btn
              color="primary"
							:disabled="currentCommand.output_cols.filter(e=>e!=='').length%currentCommand.columns.length!==0 || !((!!currentCommand.splits==currentCommand.index<currentCommand.splits) && currentCommand.separator!='')"
              text
              @click="confirmCommand()"
            >
              Accept
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-dialog persistent v-if="currentCommand.command == 'replace'" :value="currentCommand.command == 'replace'" max-width="410" @click:outside="cancelCommand">
        <v-card>
          <v-card-title class="title" v-if="currentCommand.columns.length==1">
            Replace in column
          </v-card-title>
          <v-card-title class="title" v-else>
            Replace in columns
          </v-card-title>
          <v-card-text class="pb-0 command-card-text">
            Replace from "{{currentCommand.search}}" to "{{currentCommand.replace}}"
            <template v-if="currentCommand.columns.length==1">
              in "{{currentCommand.columns[0]}}"
            </template>
            <v-text-field
              v-model="currentCommand.search"
              class="mt-4"
              label="Find"
              dense
              required
              outlined
            ></v-text-field>
            <v-text-field
              v-model="currentCommand.replace"
              label="Replace"
              dense
              required
              outlined
            ></v-text-field>
            <v-select
              v-model="currentCommand.search_by"
              class="mb-4"
              label="Search by"
              dense
              required
              outlined
              :items="[
                {text: 'Characters', value: 'chars'},
                {text: 'Words', value: 'words'}
              ]"
            ></v-select>
            <OutputColumnInputs :currentCommand.sync="currentCommand"></OutputColumnInputs>
          </v-card-text>
          <v-card-actions>
            <div class="flex-grow-1"/>
            <v-btn
              color="primary"
              text
              @click="cancelCommand"
            >
              Cancel
            </v-btn>
            <v-btn
              color="primary"
              text
              :disabled="(currentCommand.search.length<=0 || currentCommand.output_cols.filter(e=>e!=='').length%currentCommand.columns.length!==0)"
              @click="confirmCommand()"
            >
              Accept
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-dialog persistent v-if="currentCommand.command == 'fill'" :value="currentCommand.command == 'fill'" max-width="410" @click:outside="cancelCommand">
        <v-card>
          <v-card-title class="title" v-if="currentCommand.columns.length==1">
            Fill in column
          </v-card-title>
          <v-card-title class="title" v-else>
            Fill in columns
          </v-card-title>
          <v-card-text class="pb-0 command-card-text">
            Fill "{{currentCommand.fill}}"
            <template v-if="currentCommand.columns.length==1">
              in "{{currentCommand.columns[0]}}"
            </template>
            <v-text-field
              v-model="currentCommand.fill"
              class="mt-2"
              label="Fill"
              dense
              required
              outlined
            ></v-text-field>
            <!-- <OutputColumnInputs :currentCommand.sync="currentCommand"></OutputColumnInputs> -->
          </v-card-text>
          <v-card-actions>
            <div class="flex-grow-1"/>
            <v-btn
              color="primary"
              text
              @click="cancelCommand"
            >
              Cancel
            </v-btn>
            <v-btn
              color="primary"
              text
              @click="confirmCommand()"
            >
              Accept
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </template>
    <div class="sidebar-content options-fields-container" :class="{'empty': !cells.length}">
      <draggable
        tag="div"
        class="options-fields"
        :class="{'no-pe disabled': commandsDisabled,'dragging': drag}"
        v-model="cells"
        v-bind="dragOptions"
        handle=".handle"
        ref="cells"
        @start="drag = true"
        @end="drag = false"
      >
        <transition-group type="transition" :name="!drag ? 'flip-list' : null">
          <div class="cell-container" v-for="(cell, index) in cells" :key="cell.id" :class="{'cell-error': cell.error,'done': cell.done,'active': cell.active}" @click="setActiveCell(index)">

            <div class="cell">
              <div class="handle left-handle"></div>
              <!-- <div class="handle cell-title cell-type">{{index+1}}. {{cell.type}}</div> -->
              <CodeEditor
                :active="cell.active"
                @blur="runCodeLater()"
                @update:active="setActiveCell(index)"
                v-model="cell.content"
              />
              <div class="cell-type cell-type-label" v-if="cell.type && cell.type!='code'">{{cell.type}}</div>
            </div>
          </div>
        </transition-group>
      </draggable>
      <v-alert key="error" type="error" class="mt-2" dismissible v-if="codeError!='' && cells.length"  @input="codeError=''">
        {{codeError}}
      </v-alert>
      <div key="controls" ref="cell-controls" class="cell-controls toolbar vertical">
        <v-btn v-if="activeCell>=0" text class="icon-btn" color="#888" @click.stop="removeCell(activeCell)">
          <v-icon>delete</v-icon>
        </v-btn>
        <v-btn text class="icon-btn" color="primary" @click="addCell(activeCell+1)">
          <v-icon>add</v-icon>
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script>

import axios from 'axios'
axios.defaults.headers.post['Access-Control-Allow-Origin'] = '*'
import CodeEditor from '@/components/CodeEditor'
import OutputColumnInputs from '@/components/OutputColumnInputs'
import { debounce, newName } from '@/utils/functions.js'

const api_url = process.env.API_URL || 'http://localhost:5000'

export default {

  components: {
    CodeEditor,
    OutputColumnInputs
  },

  props: {
    columns: {
      type: Array,
      default: ()=>{return []}
    },
    commandsDisabled: {
      type: Boolean,
      default: false
    },
    dataset: {
      type: Object,
      required: true
    },
  },

  data () {
    return {
      cells: [],
      activeCell: -1,
      codeDone: '',
      lastWrongCode: false,
      drag: false,
      currentCommand: false,
      codeError: '',

      commandsPallete: {
        'apply sort': {
          code: (columns, payload) => {
            return `df = df.select(["${columns.join('", "')}"])`
          }
        },
        bucketizer: {
          dialog: {
            title: ()=>'Create Bins',
            output_cols: true,
            fields: [
              {
                type: 'number',
                key: 'splits',
                label: 'Splits',
                placeholder: 2,
                min: 0
              },
            ],
            validate: (command) => {
              return (command.output_cols.filter(e=>e!=='').length%command.columns.length==0) && (command.splits>0)
            }
          },
          payload: (columns) => {
            return {
              command: 'bucketizer',
              columns: columns,
              splits: 2,
              output_cols: columns.map(e=>'')
            }
          },
          code: (columns, payload) => {
            // df.cols.bucketizer("id",2,"buckets_output")
            var _argument = (columns.length==1) ? `"${columns[0]}"` : `["${columns.join('", "')}"]`

            var output_cols_argument =
              (!payload.output_cols.join('').trim().length) ?
                false
              :
                (payload.output_cols.length==1) ?
                  `"${payload.output_cols[0]}"`
                :
                  `[${payload.output_cols.map((e)=>((e!==null) ? `"${e}"` : 'None')).join(', ')}]`

            return 'df = df.cols.bucketizer('
              + _argument
              + ( (payload.splits) ? `, ${payload.splits}` : '')
              + ( (output_cols_argument) ? `, output_cols=${output_cols_argument}` : '')
              + ')'
          },
        },
        values_to_cols: {
          payload: (columns) => {
            return {
              command: 'values_to_cols',
              columns: columns
            }
          },
          code: (columns, payload) => {
            return `df = df.cols.values_to_cols("${columns[0]}")`
          }
        },
        string_to_index: {
          dialog: {
            title: ()=>'Strings to Index',
            output_cols: true,
            validate: (command) => {
              if (command.output_cols.filter(e=>e!=='').length%command.columns.length==0)
                return true
              return false
            }
          },
          payload: (columns) => {
            return {
              command: 'string_to_index',
              columns: columns,
              output_cols: columns.map(e=>'')
            }
          },
          code: (columns, payload) => {
            // cols.string_to_index(input_cols, output_cols=None)
            var _argument = (columns.length==1) ? `"${columns[0]}"` : `["${columns.join('", "')}"]`

            var output_cols_argument =
              (!payload.output_cols.join('').trim().length) ?
                false
              :
                (payload.output_cols.length==1) ?
                  `"${payload.output_cols[0]}"`
                :
                  `[${payload.output_cols.map((e)=>((e!==null) ? `"${e}"` : 'None')).join(', ')}]`

            return 'df = df.cols.string_to_index('
              + _argument
              + ( (output_cols_argument) ? `, output_cols=${output_cols_argument}` : '')
              + ')'
          },
        },
        z_score: {
          dialog: {
            title: ()=>'Calculate Z-score',
            output_cols: true,
            validate: (command) => {
              if (command.output_cols.filter(e=>e!=='').length%command.columns.length==0)
                return true
              return false
            }
          },
          payload: (columns) => {
            return {
              command: 'z_score',
              columns: columns,
              output_cols: columns.map(e=>'')
            }
          },
          code: (columns, payload) => {
            // cols.z_score(input_cols, output_cols=None)
            var _argument = (columns.length==1) ? `"${columns[0]}"` : `["${columns.join('", "')}"]`

            var output_cols_argument =
              (!payload.output_cols.join('').trim().length) ?
                false
              :
                (payload.output_cols.length==1) ?
                  `"${payload.output_cols[0]}"`
                :
                  `[${payload.output_cols.map((e)=>((e!==null) ? `"${e}"` : 'None')).join(', ')}]`

            return 'df = df.cols.z_score('
              + _argument
              + ( (output_cols_argument) ? `, output_cols=${output_cols_argument}` : '')
              + ')'
          },
        },
        impute: {
          dialog: {
            title: ()=>'Impute rows',
            output_cols: true,
            fields: [
              {
                type: 'select',
                key: 'data_type',
                label: 'Data type',
                placeholder: 'Data type',
                items: [
                  {text: 'Continuous', value: 'continuous'},
                  {text: 'Categorical', value: 'categorical'}
                ]
              },
              {
                type: 'select',
                key: 'strategy',
                label: 'Strategy',
                placeholder: 'Strategy',
                items: [
                  {text: 'Mean', value: 'mean'},
                  {text: 'Median', value: 'median'}
                ]
              },
            ],
            validate: (command) => {
              if (command.output_cols.filter(e=>e!=='').length%command.columns.length==0)
                return true
              return false
            }
          },
          payload: (columns) => {
            return {
              command: 'impute',
              data_type: 'continuous',
              strategy: 'mean',
              columns: columns,
              output_cols: columns.map(e=>'')
            }
          },
          code: (columns, payload) => {
            // df.cols.impute(input_cols, data_type="continuous", strategy="mean", output_cols=None)
            var _argument = (columns.length==1) ? `"${columns[0]}"` : `["${columns.join('", "')}"]`

            var output_cols_argument =
              (!payload.output_cols.join('').trim().length) ?
                false
              :
                (payload.output_cols.length==1) ?
                  `"${payload.output_cols[0]}"`
                :
                  `[${payload.output_cols.map((e)=>((e!==null) ? `"${e}"` : 'None')).join(', ')}]`

            return 'df = df.cols.impute('
              + _argument
              + `, "${payload.data_type}"`
              + `, "${payload.strategy}"`
              + ( (output_cols_argument) ? `, output_cols=${output_cols_argument}` : '')
              + ')'
          },
        },
        /*
        random_split: {
          dialog: {
            title: ()=>'Split train and test',
            inputs: [
              {
                type: 'number',
                key: 'weight1',
                label: 'Weight 1',
                placeholder: 0.2,
                value: 0.2
              },
              {
                type: 'number',
                key: 'weight2',
                label: 'Weight 2',
                placeholder: 0.8,
                value: 0.8
              },
              {
                type: 'text',
                key: 'seed',
                label: 'Seed',
                placeholder: 1,
                value: ''
              },
              {
                type: 'text',
                key: 'new_df',
                label: 'Seed',
                placeholder: 1,
                value: ''
              }
            ],
            validate: (command) => {
              if (command.weight1 && command.weight2)
                return true
              return false
            }
          },
          payload: (columns) => {
            return {
              command: 'random_split',
              columns: [],
              self: 'df',
              weight1: 0.2,
              weight2: 0.8,
              seed: 1,
              new_df: 'splitted'
            }
          },
          code: (columns, payload) => {
            return `dfs['${payload.new_df}'] = df.random_split(${payload.self}, weights=[${payload.weight1},${payload.weight2}], seed=${payload.seed})`
          }
        }
        */
      },

    }
  },

  computed: {

    cellsOrder () {
      return this.cells.map(e=>{
        return e.id
      }).join()
    },

    dragOptions () {
      return {
        animation: 200,
        group: "description",
        disabled: false,
        ghostClass: "ghost"
      }
    },

    _commandsDisabled: {
      get () {
        return this.commandsDisabled
      },
      set (val) {
        this.$emit('update:commandsDisabled',val)
      }
    }

  },

  watch: {
    cellsOrder: {
      handler () {
        this.runCode()
        if (!this.cells.length)
          this.codeError = ''
      }
    }
  },

  methods: {
    commandHandle ( event ) {

			var payload = undefined
			var _columns = undefined

      if (!event.columns || !event.columns.length)
        _columns = this.columns.map(e=>this.dataset.columns[e.index].name)
      else
        _columns = event.columns

      switch (event.command) {
        case 'create':
          this.currentCommand = {
            command: 'create',
            fromColumns: _columns,
            expression: (_columns.length!=0) ? _columns.map(e=>`df["${e}"]`).join(' + ') : '',
            name:
              (_columns.length==0) ?
                false
              : (_columns.length==1) ?
                  `"${_columns[0]}"`
                :
                  'columns',
            newName: ''
          }
          break;
        case 'rename':
          this.currentCommand = {
            command: 'rename',
            columns: _columns,
            name: (_columns.length==1) ? `"${_columns[0]}"` : 'columns',
            renames: _columns.map((e)=>{
              return{
                name: e,
                newName: ''
              }
            })
          }
          break;
        case 'duplicate':
          this.currentCommand = {
            command: 'duplicate',
            columns: _columns,
            name: (_columns.length==1) ? `"${_columns[0]}"` : 'columns',
            output_cols: _columns.map(e=>newName(e))
          }
          break;
        case 'nest':
          this.currentCommand = {
						command: 'nest',
						columns: _columns,
						separator: ', ',
						newName: ''
					}
          break;
        case 'unnest':
          this.currentCommand = {
						command: 'unnest',
						columns: _columns,
						// shape: 'string',
						separator: ', ',
						splits: 2,
						index: '',
						output_cols: _columns.map(e=>'')
					}
          break;
        case 'replace':
          this.currentCommand = {
						command: 'replace',
						columns: _columns,
						search: '', replace: '',
						search_by: 'chars',
						output_cols: _columns.map(e=>'')
					}
          break;
        case 'fill':
          this.currentCommand = {
            command: 'fill',
            columns: _columns,
            fill: '',
            output_cols: _columns.map(e=>'')
          }
					break;
				case 'cast':
					payload = { cast_type: event.cast_type }
          this.addCell(-1, event.command, _columns, payload )
					break;
				case 'lower':
				case 'upper':
				case 'remove_accents':
				case 'remove_special_chars':
				case 'trim':
					payload = undefined
					if (!_columns.length)
						_columns = ["*"]
          this.addCell(-1, event.command, _columns, payload )
          break;
        case 'drop':
        case 'keep':
        default:
          if (this.commandsPallete[event.command]) {
            var _command = this.commandsPallete[event.command]
            if (_command.dialog) {
              this.currentCommand = _command.payload ? _command.payload(_columns) : undefined
            }
            else {
              payload = _command.payload ? _command.payload(_columns) : undefined
              this.addCell(-1, event.command, _columns, payload )
            }
          }
          else {
            payload = undefined
            this.addCell(-1, event.command, _columns, payload )
            break;
          }
      }
    },

    confirmCommand() {
      this.addCell(-1, this.currentCommand.command, this.currentCommand.columns, this.currentCommand )
      this.currentCommand = false
    },

    cancelCommand() {
      this.currentCommand = false
    },

    setActiveCell (index) {
      for (let i = 0; i < this.cells.length; i++) {
        this.cells[i].active = false
      }
      if (this.cells[index]) {
        this.cells[index].active = true
        this.activeCell = index
        if (this.$refs.cells && this.$refs['cell-controls']) {
          this.$refs['cell-controls'].style.top = (this.$refs.cells.$el.getElementsByClassName('cell-container')[index].offsetTop+11) + 'px'
        }
      }
      else {
        this.activeCell = -1
        if (this.$refs['cell-controls']) {
          this.$refs['cell-controls'].style.top = '13px'
        }
      }
    },

    removeCell (index) {
      if (index<0)
        return

      this.cells.splice(index,1)
      if (this.cells.length==index) {
        index--
      }
      this.setActiveCell(index)
    },

    markCells(mark = true) {
      for (let i = 0; i < this.cells.length; i++) {
        if (this.cells[i].content) {
          this.cells[i].done = mark
        }
        this.cells[i].error = false
      }

      if (mark && this.cells)
        this.codeDone = this.cells.map(e=>(e.content!=='') ? e.content+'\n' : '').join('').trim()
      else
        this.codeDone = ''

    },

    markCellsError() {
      for (let i = 0; i < this.cells.length; i++) {
        if (!this.cells[i].done && this.cells[i].content)
          this.cells[i].error = true
      }
    },

    addCell (at = -1, type = 'code', columns = [], payload) {

      var content = ''

      if (!columns.length)
        columns = this.columns.map(e=>this.dataset.columns[e.index].name)

      switch (type) {
        case 'create':
          content = `df = df.cols.create("${payload.newName}"`
            +( (payload.expression) ? `, ${payload.expression}` : '')
            +`)`
          break;
        case 'drop':
          content = `df = df.cols.drop(["${columns.join('", "')}"])`
          break;
        case 'rename':
          if (payload.renames.length==1) {
            content = `df = df.cols.rename("${payload.renames[0].name}", "${payload.renames[0].newName}")`
          }
          else {
            content = `df = df.cols.rename([${payload.renames.map(e=>`("${e.name}", "${e.newName}")`)}])`
          }
          break;
        case 'duplicate':
          var _argument = (columns.length==1) ? `"${columns[0]}"` : `["${columns.join('", "')}"]`
					var output_cols_argument =
						(!payload.output_cols.join('').trim().length) ? false :
						(payload.output_cols.length==1) ? `"${payload.output_cols[0]}"` :
						`[${payload.output_cols.map((e)=>((e!==null) ? `"${e}"` : 'None')).join(', ')}]`
          content = 'df = df.cols.copy('
						+_argument
						+( (output_cols_argument) ? `, output_cols=${output_cols_argument}` : '')
						+')'
          break;
        case 'keep':
          content = `df = df.cols.keep(["${columns.join('", "')}"])`
          break;
        case 'nest':
          content = `df = df.cols.nest(["${columns.join('", "')}"]`
						+( (payload.separator) ? `, separator="${payload.separator}"` : '')
						+`, output_col="${payload.newName}")`
          break;
        case 'unnest':
					var _argument = (columns.length==1) ? `"${columns[0]}"` : `["${columns.join('", "')}"]`
					var output_cols_argument =
						(!payload.output_cols.join('').trim().length) ? false :
						(payload.output_cols.length==1) ? `"${payload.output_cols[0]}"` :
						`[${payload.output_cols.map((e)=>((e!==null) ? `"${e}"` : 'None')).join(', ')}]`
          content = 'df = df.cols.unnest('
						+_argument
						+( (payload.separator) ? `, separator="${payload.separator}"` : '')
						+( (payload.splits) ? `, splits=${payload.splits}` : '')
						+( (payload.index) ? `, index=${payload.index}` : '')
						+( (output_cols_argument) ? `, output_cols=${output_cols_argument}` : '')
						+')'
          break;
        case 'replace':
          var _argument = (columns.length==1) ? `"${columns[0]}"` : `["${columns.join('", "')}"]`
					var output_cols_argument =
						(!payload.output_cols.join('').trim().length) ? false :
						(payload.output_cols.length==1) ? `"${payload.output_cols[0]}"` :
						`[${payload.output_cols.map((e)=>((e!==null) ? `"${e}"` : 'None')).join(', ')}]`
					content = 'df = df.cols.replace('
						+_argument
						+`, search="${payload.search}"`
						+`, replace_by="${payload.replace}"`
						+`, search_by="${payload.search_by}"`
						+( (output_cols_argument) ? `, output_cols=${output_cols_argument}` : '')
						+')'
          break;
        case 'fill':
          var _argument = (columns.length==1) ? `"${columns[0]}"` : `["${columns.join('", "')}"]`
          var output_cols_argument =
						(!payload.output_cols.join('').trim().length) ? false :
						(payload.output_cols.length==1) ? `"${payload.output_cols[0]}"` :
						`[${payload.output_cols.map((e)=>((e!==null) ? `"${e}"` : 'None')).join(', ')}]`
          content = 'df = df.cols.fill_na('
						+_argument
						+`, "${payload.fill}"`
						+( (output_cols_argument) ? `, output_cols=${output_cols_argument}` : '')
						+')'
					break;
				case 'cast':
					var _argument = columns.map(e=>`("${e}","${payload.cast_type}")`)
          content = `df = df.cols.cast([${_argument}])`
					break;
				case 'lower':
				case 'upper':
				case 'remove_accents':
				case 'remove_special_chars':
				case 'trim':
					var _argument = (columns.length==1) ? `"${columns[0]}"` : `input_cols=["${columns.join('", "')}"]`
          content = `df = df.cols.${type}(${_argument})`
          break;
				default:
          if (this.commandsPallete[type]) {
            var _command = this.commandsPallete[type]
            content = _command.code ? _command.code(columns, payload) : ''
          }
          else {

          }
          break;
      }

      if (at==-1)
        at = this.cells.length

      this.cells.splice(at,0,{ type, content, id: Number(new Date()), active: false })

      this.$nextTick(()=>{
        if (this.activeCell<0)
          this.setActiveCell(0)
        if (content.length)
          this.runCode()
      })

    },

    runCodeLater() {
      setTimeout(() => {
        this.runCode()
      }, 400);
    },

    runCode: debounce(async function() {

      var code = this.cells.map(e=>(e.content!=='') ? e.content+'\n' : '').join('').trim()
      var codeDone = this.codeDone.trim()
      var rerun

      if (code == codeDone && code!==''){
        return;
      }
      else if (code.indexOf(codeDone)!=0 || codeDone=='') {
        rerun = true
      }
      else {
        code = this.cells.filter(e=>!e.done).map(e=>(e.content!=='') ? e.content+'\n' : '').join('').trim()
      }

      if (code===this.lastWrongCode) {
        return;
      }

      if (rerun)
        this.markCells(false)

      this._commandsDisabled = true;

      try {
        var response = await axios.post(api_url+(rerun ? '/run-load' : '/run'),
        {
          code,
          name: this.dataset.name
        })
        console.log('response',response)
        this._commandsDisabled = false;
        if (response.data.content === '\'run ok\'') {
          this.markCells()
          this.codeError = ''
          this.lastWrongCode = false
        }
        else {
          this.codeError = response.data.error.ename + ': ' + response.data.error.evalue
          this.markCellsError()
          this.lastWrongCode = code
        }
      } catch (error) {
        console.error(error)
      }

    },1000)
  }
}
</script>
