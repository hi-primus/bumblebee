<template>
  <div>
    <div
      persistent
      v-if="command && command.dialog"
      v-show="(currentCommand.command)"
      ref="command-form"
      @click:outside="cancelCommand"
      @keydown.esc="cancelCommand"
    >
      <v-form @submit.prevent="confirmCommand" id="command-form" class="pl-4 pr-5 pt-4 smaller-fields">
          <div class="body-2 mb-1" :class="{'title': command.dialog.bigText}" v-if="command.dialog.text">
            {{
              (typeof command.dialog.text == 'function') ?
                command.dialog.text(currentCommand)
              :
                command.dialog.text
            }}
          </div>
          <div class="progress-middle" style="height: 65%">
            <v-progress-circular
              indeterminate
              color="#888"
              size="64"
              v-if="currentCommand.loading"
            />
          </div>
          <template v-if="!currentCommand.loading && command.dialog.fields">
            <template v-for="field in command.dialog.fields.filter(f=>(!f.condition || f.condition && f.condition(currentCommand)))">
              <template v-if="field.type=='action'">
                <v-btn
                  :key="field.key"
                  depressed
                  color="primary"
                  @click="(field.func) ? command[field.func]() : 0"
                  class="mb-6 mx-a d-flex"
                  :disabled="field.validate && !field.validate(currentCommand)"
                >
                  {{
                    (typeof field.label == 'function') ?
                      field.label(currentCommand)
                    :
                      field.label
                  }}
                </v-btn>
              </template>
              <template v-if="field.type=='text'">
                <div
                  :key="field.key"
                  class="mb-6"
                  :class="{'title': field.big}"
                  v-if="field.text"
                >
                  {{
                    (typeof field.text == 'function') ?
                      field.text(currentCommand)
                    :
                      field.text
                  }}
                </div>
              </template>
              <template v-if="field.type=='file'">
                <v-file-input
                  v-model="currentCommand[field.key]"
                  :key="field.key"
                  :label="(typeof field.label == 'function') ? field.label(currentCommand) : (field.label || '')"
                  :placeholder="(typeof field.placeholder == 'function') ? field.placeholder(currentCommand) : (field.placeholder || '')"
                  :clearable="field.clearable"
                  @input="(field.onChange) ? command[field.onChange]() : 0"
                  dense
                  required
                  outlined
                ></v-file-input>
              </template>
              <template v-if="field.type=='field'">
                <v-text-field
                  v-model="currentCommand[field.key]"
                  :key="field.key"
                  :label="(typeof field.label == 'function') ? field.label(currentCommand) : (field.label || '')"
                  :placeholder="(typeof field.placeholder == 'function') ? field.placeholder(currentCommand) : (field.placeholder || '')"
                  :clearable="field.clearable"
                  @input="(field.onChange) ? command[field.onChange]() : 0"
                  dense
                  required
                  outlined
                ></v-text-field>
              </template>
              <template v-if="field.type=='chips'">
                <v-combobox
                  v-model="currentCommand[field.key]"
                  :key="field.key"
                  :label="(typeof field.label == 'function') ? field.label(currentCommand) : (field.label || '')"
                  :placeholder="(typeof field.placeholder == 'function') ? field.placeholder(currentCommand) : (field.placeholder || '')"
                  :clearable="field.clearable"
                  autocomplete="off"
                  chips
                  deletable-chips
                  :items="[]"
                  class="chips-no-items"
                  multiple
                >
                </v-combobox>
              </template>
              <template v-if="field.type=='outliers-range'">
                <Outliers
                  :key="field.key"
                  v-if="currentCommand[field.key]"
                  :data="currentCommand[field.key]"
                  :columnName="currentCommand.columns[0]"
                  :selection.sync="currentCommand[field.selection_key]"
                />
              </template>
              <template v-if="field.type=='switch'">
                <v-switch
                  :key="field.key"
                  v-model="currentCommand[field.key]"
                  color="black"
                  :label="(typeof field.label == 'function') ? field.label(currentCommand) : field.label"
                ></v-switch>
              </template>
              <template v-else-if="field.type=='password'">
                <v-text-field
                  v-model="currentCommand[field.key]"
                  :key="field.key"
                  :label="field.label"
                  :placeholder="field.placeholder"
                  dense
                  required
                  outlined
                  :append-icon="field.showable ? (field.show ? 'visibility' : 'visibility_off') : undefined"
                  :type="(field.show || !field.showable) ? 'text' : 'password'"
                  :clearable="field.clearable"
                  @input="(field.onChange) ? command[field.onChange]() : 0"
                  @click:append="field.show = !field.show"
                />
              </template>
              <template v-else-if="field.type=='number'">
                <v-text-field
                  type="number"
                  v-model="currentCommand[field.key]"
                  :key="field.key"
                  :label="field.label"
                  :placeholder="field.placeholder"
                  :min="field.min"
                  :clearable="field.clearable"
                  @input="(field.onChange) ? command[field.onChange]() : 0"
                  dense
                  required
                  outlined
                ></v-text-field>
              </template>
              <template v-else-if="field.type=='number_index'">
                <v-text-field
                  type="number"
                  :value="(currentCommand.index>=0) ? currentCommand.index : ''"
                  @input="currentCommand.index = ($event>=0) ? $event : ''"
                  :key="field.key"
                  label="Index"
                  :clearable="field.clearable"
                  :max="(field.splits!=='') ? field.splits-1 : undefined"
                  :placeholder="field.placeholder"
                  :min="field.min"
                  dense
                  required
                  outlined
                ></v-text-field>
              </template>
              <template v-else-if="field.type=='select' && (!field.items_key == !currentCommand[field.items_key])">
                <v-select
                  :key="field.key"
                  v-model="currentCommand[field.key]"
                  :label="field.label"
                  :placeholder="field.placeholder"
                  :items="(field.items_key) ? currentCommand[field.items_key] : field.items"
                  @input="(field.onChange) ? command[field.onChange]() : 0"
                  :disabled="!!+field.disabled"
                  dense
                  required
                  outlined
                ></v-select>
              </template>
              <template v-else-if="field.type=='select-foreach'">
                <v-row :key="field.key" no-gutters class="foreach-label">
                  <template v-for="(title, i) in currentCommand.columns">
                    <v-col v-if="!field.noLabel" :key="i+'label'" class="col-12 col-sm-4 col-md-3 font-weight-bold pr-4 text-ellipsis" :title="title">
                      {{title}}
                    </v-col>
                    <v-col :key="i" class="col-12 oci-input-container" :class="{'col-sm-8 col-md-9': !field.noLabel}">
                      <v-select
                        v-model="currentCommand[field.key][i]"
                        :key="field.key"
                        :label="field.label===true ? title : field.label"
                        :placeholder="field.placeholder===true ? title : field.placeholder"
                        :items="(field.items_key) ? currentCommand[field.items_key] : field.items"
                        dense
                        required
                        outlined
                      ></v-select>
                    </v-col>
                  </template>
                </v-row>
              </template>
              <template v-else-if="field.type=='clusters'">
                <div :key="field.key" class="clusters-table-container" style="overflow-y: auto; min-heigth: 240px;">
                  <div v-for="(cluster, i) in currentCommand[field.key]" :key="i+'label'" class="cluster" :class="{'disabled-cluster': !cluster.merge}" >
                      <v-data-table
                        flat
                        depressed
                        v-model="cluster.selected"
                        :items="cluster.values"
                        :headers="clusterHeaders"
                        :sort-by="'count'"
                        sort-desc
                        disable-pagination
                        item-key="value"
                        dense
                        show-select
                        hide-default-footer
                      >
                      </v-data-table>
                      <div class="cluster-info">
                        {{`${cluster.values.length} value${(cluster.values.length!=1 ? 's' : '')}`}} · {{`${cluster.count} row${(cluster.count!=1 ? 's' : '')}`}}
                        <!-- · 5 rows -->
                      </div>
                      <v-text-field
                        v-model="cluster.replace"
                        class="cluster-replace-field pt-2"
                        :label="(field.label===true ? cluster.replace : field.label) || 'New cell value'"
                        :placeholder="field.placeholder===true ? cluster.replace : field.placeholder"
                        :disabled="false && !cluster.selected.length"
                        @input="clusterFieldUpdated(cluster)"
                        dense
                        required
                        outlined
                      ></v-text-field>
                  </div>
                </div>
              </template>
            </template>
          </template>
          <OutputColumnInputs v-if="command.dialog.output_cols" :fieldLabel="command.dialog.output_cols_label" :noLabel="command.dialog.no_label" :currentCommand.sync="currentCommand"></OutputColumnInputs>
          <template>
            <v-alert key="error" type="error" class="mt-3" dismissible v-if="currentCommand.error"  @input="currentCommand.error=''">
              {{currentCommand.error}}
            </v-alert>
          </template>
          <div class="d-flex justify-end">
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              dense
              text
              v-if="command.onTest"
              :loading="currentCommand.loadingTest"
              :disabled="command.dialog.testValidate && !command.dialog.testValidate(currentCommand)"
              @click="command.onTest(currentCommand)"
            >
              {{ command.dialog.testLabel || 'Test'}}
            </v-btn>
            <v-btn
              color="primary"
              dense
              text
              @click="cancelCommand"
            >
              Cancel
            </v-btn>
            <v-btn
              color="primary"
              depressed
              dense
              :disabled="command.dialog.validate && !command.dialog.validate(currentCommand)"
              :loading="currentCommand.loadingAccept"
              type="submit"
              form="command-form"
            >
              {{
                command.dialog.acceptLabel ? (
                  typeof command.dialog.acceptLabel == 'function' ?
                    command.dialog.acceptLabel(currentCommand)
                  :
                    command.dialog.acceptLabel
                ):
                  'Accept'
              }}
            </v-btn>
          </div>
        <!-- </v-card> -->
      </v-form>
    </div>
    <div
      v-show="view=='operations'"
      class="sidebar-content options-fields-container"
      :class="{'empty': !cells.length}"
      ref="cells-container"
    >
      <draggable
        tag="div"
        class="options-fields"
        :class="{ 'no-pe disabled': commandsDisabled, 'dragging': drag }"
        :list="cells"
        v-bind="dragOptions"
        handle=".handle"
        ref="cells"
        @start="drag = true"
        @end="drag = false; draggableEnd()"
      >
        <div
          class="cell-container"
          v-for="(cell, index) in this.cells"
          :key="cell.id"
          :class="{'fixed-cell': cell.fixed, 'cell-error': cell.error,'done': cell.done,'active': activeCell>=0 && activeCell==index}"
          @click="setActiveCell(index)"
        >
          <div class="cell">
            <div class="handle left-handle"></div>
            <CodeEditor
              :active="activeCell==index"
              @update:active="setActiveCell(index)"
              @input="$store.commit('cellContent',{index, content: $event}) ; runButton = true"
              :value="cell.content"
            />
            <div class="cell-type cell-type-label" v-if="cell.command && cell.command!='code'">{{cell.command}}</div>
          </div>
        </div>
      </draggable>
      <v-alert key="error" type="error" class="mt-3" dismissible v-if="codeError!=''"  @input="cleanCodeError">
        {{codeError}}
      </v-alert>
      <div key="controls" ref="cells-controls" class="cells-controls toolbar vertical" :class="{'disabled': commandsDisabled}" @mouseover="barHovered = true" @mouseleave="barHovered = false">
        <v-btn v-if="activeCell>=0" text class="icon-btn" color="#888" @click.stop="removeCell(activeCell)">
          <v-icon>delete</v-icon>
        </v-btn>
        <v-btn text class="icon-btn" :color="(cells.length) ? '#888' : 'primary'" @click="addCell(activeCell+1)">
          <v-icon>add</v-icon>
        </v-btn>
        <v-btn v-if="runButton && cells.length" text class="icon-btn" color="#888" @click="runCode(true)">
          <v-icon>play_arrow</v-icon>
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script>

import CodeEditor from '@/components/CodeEditor'
import OutputColumnInputs from '@/components/OutputColumnInputs'
import Outliers from '@/components/Outliers'
import clientMixin from '@/plugins/mixins/client'
import { mapGetters } from 'vuex'
import { printError, parseResponse, debounce, newName, arrayJoin, getOutputColsArgument, escapeQuotes, escapeQuotesOn } from '@/utils/functions.js'

const api_url = process.env.API_URL || 'http://localhost:5000'

const sl = `
`

export default {

  components: {
    CodeEditor,
		OutputColumnInputs,
		Outliers
  },

  mixins: [clientMixin],

  props: {
    view: {
      default: false
    },
    big: {
      default: true
    },
    columns: {
      type: Array,
      default: ()=>{return []}
    },
    commandsDisabled: {
      default: false
    },
    dataset: {
      type: Object,
      required: true
    },
    codeError: {
      type: String,
      default: ''
    }
  },

  data () {
    return {

      clusterHeaders: [
        { text: 'Rows', value: 'count', sortable: false, class: 'rows-count' },
        { text: 'Values', value: 'value', sortable: false }
      ],

      barTop: 0,
      barHovered: false,

      activeCell: -1,
      codeDone: '',
      lastWrongCode: false,
      drag: false,
      currentCommand: false,
      firstRun: true,
      runButton: false,

      cancelPromise: {},

      commandsPallete: {
        'apply sort': {
          code: (payload) => {
            return `.cols.sort(columns=["${payload.columns.join('", "')}"])`
          }
        },
        DROP_KEEP: {
          code: (payload) => {
            return `.cols.${payload.command}(["${payload.columns.join('", "')}"])`
          }
        },
        'sort rows': {
          dialog: {
            title: 'Sort rows',
            text: (c) => {
              return `Sort using ${arrayJoin(c.columns)}`
            },
            fields: [
              {
                key: 'orders',
                label: 'Order',
                type: 'select-foreach',
                items: [
                  { text: 'Ascending', value: 'asc' },
                  { text: 'Descending', value: 'desc' }
                ]
              }
            ],
          },

          payload: (columns) => ({
            columns,
            orders: columns.map(e=>'asc'),
          }),

          code: (payload) => {
            var _argument = (payload.columns.length==1) ?
              `"${payload.columns[0]}","${payload.orders[0]}"` :
              `[${payload.columns.map((e,i)=>(`("${e}","${payload.orders[i]}")`)).join(',')}]`
            return `.rows.sort( ${_argument} )`
          }
        },
        FILTER: {
          code: (payload) => {
            var values = this.currentSelection.ranged.values
            var ranges = this.currentSelection.ranged.ranges
            var type = (this.currentSelection.ranged.values && this.currentSelection.ranged.values.length) ? 'values' : 'ranges'
            var action = payload.command=='keep rows' ? 'select' : 'drop'
            var expression

            if (type=='values') {
              values = values.map(v=>escapeQuotes(v))
              expression = `${this.dataset.varname}.${payload.columns[0]}.isin(["${values.join('", "')}"])`
            }
            else {
              if (ranges.length>1)
                expression = '('
                +ranges.map(range=>`(${this.dataset.varname}["${payload.columns[0]}"]>=${range[0]}) & (${this.dataset.varname}["${payload.columns[0]}"]<=${range[1]})`).join(' | ')
                +')'
              else
                expression = `(${this.dataset.varname}["${payload.columns[0]}"]>=${ranges[0][0]}) & (${this.dataset.varname}["${payload.columns[0]}"]<=${ranges[0][1]})`
            }
            return `.rows.${action}( ${expression} )`
          }

        },
        'filter rows': {
          dialog: {
            title: 'Filter rows',
            text: (c)=>`In column "${c.columns[0]}"`,
            fields: [
              {
                key: 'condition',
                label: 'Condition',
                type: 'select',
                items: [
                  { text: 'Is exactly', value: 'exactly' },
                  { text: 'Is one of', value: 'oneof' },
                  { text: 'Is not', value: 'not' },
                  { divider: true },
                  { text: 'Less than or equal to', value: 'less' },
                  { text: 'Greater than or equal to', value: 'greater' },
                  { text: 'Is Between', value: 'between' },
                  { divider: true },
                  { text: 'Contains', value: 'contains' },
                  { text: 'Starts with', value: 'startswith' },
                  { text: 'Ends with', value: 'endswith' },
                  { divider: true },
                  { text: 'Custom expression', value: 'custom' },
                  { text: 'Selected', value: 'selected', disabled: true }
                ],
                disabled: {valueOf: ()=>this.selectionType!='columns'}
              },
              {
                condition: (c)=>['exactly','not','less','greater'].includes(c.condition),
                key: 'value',
                placeholder: 'numeric or "string"',
                label: 'Value',
                type: 'field'
              },
              {
                condition: (c)=>('oneof'==c.condition),
                key: 'values',
                placeholder: 'Values',
                label: 'Values',
                type: 'chips',
                clearable: true
              },
              {
                condition: (c)=>('between'==c.condition),
                key: 'value',
                label: 'Min value',
                placeholder: '0',
                type: 'number'
              },
              {
                condition: (c)=>('between'==c.condition),
                key: 'value_2',
                label: 'Max value',
                placeholder: '1',
                type: 'number'
              },
              {
                condition: (c)=>('custom'==c.condition),
                key: 'expression',
                label: 'Expression',
                placeholder: 'df["col_name"]>=0',
                type: 'field'
              },
              {
                condition: (c)=>['contains','startswith','endswith'].includes(c.condition),
                key: 'text',
                label: 'Text',
                placeholder: 'lorem ipsum',
                type: 'field'
              },
              {
                key: 'action',
                label: 'Action',
                type: 'select',
                items: [
                  {text: 'Keep matching rows', value: 'select'},
                  {text: 'Drop matching rows', value: 'drop'}
                ]
              }
            ],
            validate: (c) => {

              this.currentCommand._highlightColor = (c.action==='select') ? 'green' : 'red'

              switch (c.condition) {
                case 'oneof':
                  return (c.values.length)
                case 'exactly':
                case 'not':
                case 'less':
                case 'greater':
                  return (c.value!='')
                case 'between':
                  return (c.value!='' && c.value_2!='')
                case 'contains':
                case 'startswith':
                case 'endswith':
                  return (c.text!='')
                case 'custom':
                  return (c.expression!='')
                case 'selected':
                  return true
                default:
                  return false
              }
            }
          },

          payload: (columns) => {

            var condition = 'exactly'
            var selectionType, selection


            if (this.selectionType=='ranges') {
              selectionType = this.selectionType
              selection = { ranges: this.currentSelection.ranged.ranges }
              condition = 'selected'
            }
            else if (this.selectionType=='values') {
              selectionType = this.selectionType
              selection = { values: this.currentSelection.ranged.values }
              condition = 'selected'
            }

            return {
              columns,
              condition,
              selection,
              selectionType,
              value: '',
              value_2: '',
              values: [],
              text: '',
              expression: `${this.dataset.varname}["${columns[0]}"]`,
              action: 'select',
              _preview: 'filter rows',
              _highlightColor: 'green'
            }
          },

          code: (payload) => {

            var expression = payload.expression
            var varname = this.dataset.varname

            if (payload._requestType==='preview') {
              varname = `${varname}.ext.get_buffer()`
            }

            try {
              payload = escapeQuotesOn(payload,['text','selection'])
            } catch (error) {
              console.error(error)
            }

            switch (payload.condition) {
              case 'exactly':
                expression = `${varname}["${payload.columns[0]}"]==${payload.value}`
                break
              case 'oneof':
                expression = `${varname}.${payload.columns[0]}.isin([${payload.values.join(', ')}])`
                break
              case 'not':
                expression = `${varname}["${payload.columns[0]}"]!=${payload.value}`
                break
              case 'less':
                expression = `${varname}["${payload.columns[0]}"]<=${payload.value}`
                break
              case 'greater':
                expression = `${varname}["${payload.columns[0]}"]>=${payload.value}`
                break
              case 'between':
                expression = `(${varname}["${payload.columns[0]}"]>=${payload.value}) & (${varname}["${payload.columns[0]}"]<=${payload.value_2})`
                break
              case 'contains':
              case 'startswith':
              case 'endswith':
                expression = `${varname}["${payload.columns[0]}"].str.${payload.condition}("${payload.text}", na=False)`
                break
              case 'selected':
                if (payload.selectionType=='ranges') {
                  if (payload.selection.ranges.length>1) {

                    expression = '('
                    +payload.selection.ranges.map(range=>`(${varname}["${payload.columns[0]}"]>=${range[0]}) & (${varname}["${payload.columns[0]}"]<=${range[1]})`).join(' | ')
                    +')'
                  } else {
                    expression = `(${varname}["${payload.columns[0]}"]>=${payload.selection.ranges[0][0]}) & (${varname}["${payload.columns[0]}"]<=${payload.selection.ranges[0][1]})`
                  }
                }
                else if (payload.selectionType=='values') {
                  payload.selection.values = payload.selection.values.map(v=>escapeQuotes(v))
                  expression = `${varname}["${payload.columns[0]}"].isin(["${payload.selection.values.join('","')}"])`
                }
              case 'custom':
              default:
            }
            if (payload._requestType==='preview') {
              return `.rows.find( ${expression} )` // ${varname}.rows.${payload.action}()
            } else {
              return `.rows.${payload.action}( ${expression} )` // ${varname}.rows.${payload.action}()
            }
          }
        },
        STRING: {
          dialog: {
            title: 'String operation',
            output_cols: true,
          },
          payload: (columns) => ({
            columns: columns,
            output_cols: columns.map(e=>''),
            _preview: 'STRING'
          }),
          code: (payload) => {

            var output_cols_argument = getOutputColsArgument(payload.output_cols, payload.columns, (payload._requestType) ? 'new ' : '')

            var _argument = payload.columns.length==0
              ? `"*"`
              : payload.columns.length===1
                ? `"${payload.columns[0]}"`
                : `input_cols=["${payload.columns.join('", "')}"]`

            return `.cols.${payload.command}(${_argument}`
            + ( output_cols_argument ? `, output_cols=${output_cols_argument}` : '')
            + `)`
          }
        },
        cast: {
          code: (payload) => {
            var _argument = (payload.columns.length==1) ? `"${payload.columns[0]}"` : `["${payload.columns.join('", "')}"]`
            return `.cols.cast(`
            +_argument
            +`, dtype="${payload.dtype}"`
            +')'
          }
        },
        fill_na: {
          dialog: {
            title: (command)=>'Fill in ' + (command.columns.length==1 ? `column` : 'columns'),
            text: (command) => {
              return `Fill "${command.fill}"`
              + (command.columns.length==1 ? ` in ${command.columns[0]}` : '')
            },
            output_cols: true,
            fields: [
              {
                type: 'field',
                label: 'Fill',
                key: 'fill'
              }
            ],
            validate: (command) => (command.fill!=='')
          },
          payload: (columns) => ({
            command: 'fill_na',
            columns: columns,
            fill: '',
            output_cols: columns.map(e=>''),
						_preview: 'fill_na'
          }),
          code: (payload) => {
            var _argument = (payload.columns.length==1) ? `"${payload.columns[0]}"` : `["${payload.columns.join('", "')}"]`
            var output_cols_argument = getOutputColsArgument(payload.output_cols, payload.columns, (payload._requestType) ? 'new ' : '')
            payload = escapeQuotesOn(payload,['fill'])
            return `.cols.fill_na(`
              +_argument
              +`, "${payload.fill}"`
              +( (output_cols_argument) ? `, output_cols=${output_cols_argument}` : '')
              +')'
          }
        },
        'load file': {
          dialog: {
            title: 'Load file',
            acceptLabel: 'Load',
            fields: [
              {
                key: 'file_input',
                label: 'File upload',
                type: 'file'
              },
              {
                condition: (c)=>c.file_input,
                type: 'action',
                label: 'Upload',
                func: 'uploadFile'
              },
              {
                type: 'separator',
                label: 'or'
              },
              {
                key: 'url',
                label: 'File url',
                placeholder: (c)=>`https://example.com/my_file.${c.file_type}`,
                type: 'field'
              },
              {
                key: 'file_type',
                label: 'File type',
                type: 'select',
                items: [
                  { text: 'CSV', value: 'csv' },
                  { text: 'XLS', value: 'xls' },
                  { text: 'JSON', value: 'json' },
                  { text: 'Avro', value: 'avro' },
                  { text: 'Parquet', value: 'parquet' }
                ]
              },
              {
                key: 'limit',
                label: 'Limit',
                min: 1,
                clearable: true,
                type: 'number'
              },
              {
                condition: (c)=>c.file_type==='csv',
                key: 'header',
                label: (c) => `First row as Header: ${c.header ? 'Yes' : 'No'}`,
                type: 'switch'
              },
              {
                condition: (c)=>c.file_type==='csv',
                key: 'null_value',
                label: 'Null value',
                type: 'field'
              },
              {
                condition: (c)=>c.file_type==='csv',
                key: 'sep',
                label: 'Separator',
                type: 'field'
              },
              {
                condition: (c)=>c.file_type==='csv',
                key: 'charset',
                label: 'File encoding',
                type: 'select',
                items: [
                  { text: 'Unicode (UTF-8)', value: 'UTF-8'}, { text: 'English (ASCII)', value: 'ASCII'},
                  { text: 'Baltic (ISO-8859-4)', value: 'ISO-8859-4'}, { text: 'Baltic (ISO-8859-13)', value: 'ISO-8859-13'},
                  { text: 'Baltic (Windows-1257)', value: 'Windows-1257'}, { text: 'Celtic (ISO-8859-14)', value: 'ISO-8859-14'},
                  { text: 'Central European (ISO-8859-2)', value: 'ISO-8859-2'}, { text: 'Central European (Windows-1250)', value: 'Windows-1250'},
                  { text: 'Chinese Traditional (BIG5)', value: 'BIG5'}, { text: 'Chinese Simplified (GB18030)', value: 'GB18030'},
                  { text: 'Chinese Simplified (GB2312)', value: 'GB2312'}, { text: 'Cyrillic (ISO-8859-5)', value: 'ISO-8859-5'},
                  { text: 'Cyrillic (Windows-1251)', value: 'Windows-1251'}, { text: 'Cyrillic (KOI8-R)', value: 'KOI8-R'}, { text: 'Cyrillic (KOI8—U)', value: 'KOI8—U'},
                  { text: 'Cyrillic (IBM866)', value: 'IBM866'}, { text: 'Greek (ISO-8859-7)', value: 'ISO-8859-7'}, { text: 'Greek (Windows-1253)', value: 'Windows-1253'},
                  { text: 'Japanese (ISO-2022-JP)', value: 'ISO-2022-JP'}, { text: 'Japanese (Shift-JIS)', value: 'Shift-JIS'},
                  { text: 'Japanese (EUC-JP)', value: 'EUC-JP'}, { text: 'Japanese (cp932)', value: 'cp932'},
                  { text: 'Korean (ISO-2022-KR)', value: 'ISO-2022-KR'}, { text: 'Korean (EUC—KR)', value: 'EUC—KR'},
                  { text: 'Latin', value: 'latin1'},
                  { text: 'Nordic (ISO-8859-10)', value: 'ISO-8859-10'}, { text: 'Thai (ISO-8859-11)', value: 'ISO-8859-11'},
                  { text: 'Turkish (ISO-8859-9)', value: 'ISO-8859-9'}, { text: 'Vietnamese (Windows-1258)', value: 'Windows-1258'},
                  { text: 'Western (ISO-8859-1)', value: 'ISO-8859-1'}, { text: 'Western (ISO-8859-3)', value: 'ISO-8859-3'},
                  { text: 'Western (Windows-1252)', value: 'Windows-1252'}
                ]
              },
              {
                condition: (c)=>c.file_type==='json',
                key: 'multiline',
                label: (c) => `Multiline: ${c.multiline ? 'Yes' : 'No'}`,
                type: 'switch'
              },
              {
                condition: (c)=>c.file_type==='xls',
                key: 'sheet_name',
                label: `Sheet name`,
                type: 'field'
              },
            ],
            validate: (c) => (c.url!='' && (c.file_type!='csv' || c.sep))
          },

          uploadFile: async () => {
            try {

              var response = await this.$store.dispatch('request/uploadFile',{file: this.currentCommand.file_input})

              if (response.fileType) {
                this.currentCommand.file_type = response.fileType
              }
              this.currentCommand.url = response.fileUrl
            } catch (error) {

            }
          },

          payload: () => ({
            command: 'load file',
            _init: true,
            file_url: '',
            file_input: '',
            file_type: 'csv',
            url: '',
            sep: ',',
            null_value: 'null',
            sheet_name: '0',
            header: true,
            limit: '',
            multiline: true,
            charset: 'UTF-8'
          }),

          code: (payload) => {
            let file = {
              header: (payload.header) ? `True` : `False`,
              multiline: (payload.multiline) ? `True` : `False`,
            }
            payload = escapeQuotesOn(payload,['sep','null_value','sheet_name'])
            let code = `${this.availableVariableName} = op.load.${payload.file_type}("${payload.url}"`
            if (payload.file_type=='csv') {
              code += `, sep="${payload.sep}"`
              code += `, error_bad_lines=False`
              code += `, header=${file.header}`
              code += `, null_value="${payload.null_value}"`
              code += `, infer_schema='true'`
              code += `, charset="${payload.charset}"`
            }
            else if (payload.file_type=='json') {
              code += `, multiline=${file.multiline}`
            }
            else if (payload.file_type=='xls') {
              code += `, sheet_name="${payload.sheet_name}"`
            }
            if (payload.limit>0) {
              code +=`, n_rows=${payload.limit}`
            }

            code += `)`

            // code +=`.rows.limit(${payload.limit})`

            code += '.ext.cache()'

            return code
          }
        },
        'string clustering': {
          dialog: {
            big: true,
            tall: true,
            title: 'String clustering',
            acceptLabel: 'Merge',
            fields: [
              {
                type: 'select',
                key: 'algorithm',
                label: 'Algorithm',
                items: [
                  {text: 'Levenshtein', value: 'levenshtein'},
                  {text: 'Fingerprint', value: 'fingerprint'},
                  {text: 'N-gram fingerprint', value: 'n_gram_fingerprint'}
                ]
              },
              {
                condition: (c)=>c.algorithm=='n_gram_fingerprint',
                type: 'number',
                label: 'N size',
                key: 'n_size'
              },
              {
                condition: (c)=>c.algorithm=='levenshtein',
                type: 'number',
                label: 'Threshold',
                key: 'threshold'
              },
              {
                type: 'action',
                label: 'Get clusters',
                func: 'getClusters',
                validate: (c)=>(c.algorithm!=c.valid.algorithm || (c.n_size!=c.valid.n_size && c.algorithm=='n_gram_fingerprint') ||(c.threshold!=c.valid.threshold && c.algorithm=='levenshtein'))
              },
              {
                type: 'clusters',
                key: 'clusters'
              }
            ],
            validate: (c) => {
              if (c.algorithm == 'n_gram_fingerprint')
                return (c.clusters && c.clusters.filter(e=>e.selected.length).length && c.n_size)
              else
                return (c.clusters && c.clusters.filter(e=>e.selected.length).length)
            },
          },
          getClusters: async () => {

            try {

              var code

              if (this.currentCommand.algorithm == 'levenshtein')
                code = `from optimus.ml import distancecluster as dc; _output = dc.levenshtein_cluster(${this.dataset.varname}, "${this.currentCommand.columns[0]}"`
                +(this.currentCommand.threshold!='' ? `, threshold=${this.currentCommand.threshold}` : '')
                +`, output="json")`
              else if (this.currentCommand.algorithm == 'fingerprint')
                code = `from optimus.ml import keycollision as kc; _output = kc.fingerprint_cluster(${this.dataset.varname}, input_cols="${this.currentCommand.columns[0]}", output="json")`
              else if (this.currentCommand.algorithm == 'n_gram_fingerprint')
                code = `from optimus.ml import keycollision as kc; _output = kc.n_gram_fingerprint_cluster(${this.dataset.varname}, input_cols="${this.currentCommand.columns[0]}", n_size=${this.currentCommand.n_size}, output="json")`
              else
                throw 'Invalid algorithm type input'

              this.currentCommand.loading = true
              this.currentCommand.clusters = false
              this.currentCommand.error = false

              var response = await this.evalCode(code)
              var clusters = parseResponse(response.data.result)

              if (!clusters) {
                response = await this.evalCode(code)
                clusters = parseResponse(response.data.result)
              }

              if (!clusters) {
                throw response
              }

              clusters = Object.entries(clusters).map(e=>{

                const cluster_name = e[0]
                const cluster_object = e[1]

                var values =
                  (Array.isArray(cluster_object.similar)) ?
                    cluster_object.similar.map(s=>({value: s, count: '1+'}))
                  :
                    Object.entries(cluster_object.similar).map( (s) => ({ value: s[0], count: s[1] }) )

                return {
                  replace: cluster_name,
                  count: (Array.isArray(cluster_object.similar)) ? '1+' : cluster_object.sum,
                  values,
                  selected: []
                }
              })

              if (!clusters.length) {
                throw 'No clusters found'
              }

              this.currentCommand = {
                ...this.currentCommand,
                valid: {
                  algorithm: this.currentCommand.algorithm,
                  threshold: this.currentCommand.threshold,
                  n_size: this.currentCommand.n_size,
                },
                clusters
              }

            } catch (error) {

              printError(error)

              var _error = error
              if ( error.error)
                _error = error.error
              if ( error.content && error.content.ename )
                _error = error.content.ename
              if ( error.content && error.content.evalue )
                _error += ': '+error.content.evalue
              this.currentCommand = {...this.currentCommand, error: _error, should_update: true}
            }

            this.currentCommand.loading = false
          },
          payload: (columns) => {
            return {
              valid: {
                algorithm: undefined,
                n_size: undefined,
                threshold: undefined
              },
              columns,
              algorithm: 'levenshtein',
              clusters: false,
              loading: false,
              n_size: 2,
              threshold: '',
              should_update: false
            }
          },
          code: (payload) => {
            return payload.clusters
            .filter(cluster=>cluster.selected.length)
            .map(cluster=>{
              var values = cluster.selected.map(e=>escapeQuotes(e.value))
              replace = escapeQuotes(cluster.replace)
              return `.cols.replace(`
              +`"${payload.columns[0]}"`
              +`, search=["${values.join('","')}"]`
              +`, replace_by="${replace}"`
              +`, search_by="full"`
              +')'
            })
            .join('\n')
          }
        },
        outliers: {
          dialog: {
            big: true,
            title: 'Outliers',
            fields: [
              {
                type: 'select',
                key: 'algorithm',
                label: 'Algorithm',
                items: [
                  {text: 'Tukey', value: 'tukey'},
                  {text: 'Mad', value: 'mad'}
                  // {text: 'Z score', value: 'z_score'},
                  // {text: 'Modified Z score', value: 'modified_z_score'}
                ],
                // onChange: 'onInit'
              },
              {
                condition: (c)=>(c.algorithm=='mad'),
                type: 'number',
                key: 'threshold',
                label: 'Threshold'
              },
              {
                type: 'action',
                label: 'Get outliers',
                func: 'getOutliers',
                validate: (c)=>(c.algorithm!=c.valid.algorithm || (c.threshold!=c.valid.threshold && c.algorithm=='mad') || !c.data)
              },
              {
                type: 'outliers-range',
                key: 'data',
                selection_key: 'selection'
              },
              {
                condition: (c)=>(c.data),
                type: 'select',
                key: 'action',
                label: 'Action',
                items: [
                  { text: 'Drop', value: 'Drop' },
                  { text: 'Keep', value: 'Keep' },
                  // { text: 'Replace', value: 'replace' }
                ],
              },
              {
                condition: (c)=>(/*c.data*/false),
                type: 'text',
                big: true,
                text: (c) => {
                  var ranges

                  if (c.selection.length>1) {
                    ranges = `some values between ${c.selection[0][0]} and ${c.selection[c.selection.length-1][1]}`
                  }
                  else if (c.selection.length==1) {
                    ranges = `values between ${c.selection[0][0]} and ${c.selection[0][1]}`
                  }
                  else {
                    ranges = 'values'
                  }

                  return `${c.action} ${ranges} in ${c.columns[0]}`
                },
              }
            ],
            validate: (c) => (c.data && (c.selection.length || ['z_score','modified_z_score'].includes(c.algorithm) ) && !c.loading)
          },
          getOutliers: async () => {

            try {

              var code

              if (this.currentCommand.algorithm == 'tukey')
                code = `outlier = ${this.dataset.varname}.outliers.tukey("${this.currentCommand.columns[0]}")`
              else if (this.currentCommand.algorithm == 'z_score')
                code = `outlier = ${this.dataset.varname}.outliers.z_score(columns="${this.currentCommand.columns[0]}", threshold=${this.currentCommand.threshold})`
              else if (this.currentCommand.algorithm == 'mad')
                code = `outlier = ${this.dataset.varname}.outliers.mad(columns="${this.currentCommand.columns[0]}", threshold=${this.currentCommand.threshold})`
              else if (this.currentCommand.algorithm == 'modified_z_score')
                code = `outlier = ${this.dataset.varname}.outliers.modified_z_score(columns="${this.currentCommand.columns[0]}", threshold=${this.currentCommand.threshold})`
              else
                throw 'Invalid algorithm type input'

              this.currentCommand.loading = true

              var response = await this.evalCode(`import json; ${code}; _output = json.dumps(outlier.info())`)
              var outliers_data = parseResponse(response.content)

              if (!outliers_data) {
                response = await this.evalCode(`import json; ${code}; _output = json.dumps(outlier.info())`)
                outliers_data = parseResponse(response.content)
              }

              if (!outliers_data) {
                throw response
              }

              if ( ['tukey','mad'].includes(this.currentCommand.algorithm) ) {

                var hist_response = await this.evalCode(`_output = outlier.hist("${this.currentCommand.columns[0]}")`)
                var hist_data = parseResponse(hist_response.content)

                if (!hist_data) {
                  hist_response = await this.evalCode(`_output = outlier.hist("${this.currentCommand.columns[0]}")`)
                  hist_data = parseResponse(hist_response.content)
                }

                if (!hist_data) {
                  throw hist_response
                }

                var hist = hist_data[this.currentCommand.columns[0]].hist

                outliers_data = { ...outliers_data, hist }

              }

              this.currentCommand = {
                ...this.currentCommand,
                valid: {
                  algorithm: this.currentCommand.algorithm,
                  threshold: this.currentCommand.threshold,
                },
                data: outliers_data,
                selection: [],
                code_done: code
              }


            } catch (error) {

              printError(error)

              var _error = error
              if ( error.error)
                _error = error.error
              if (error.content && error.content.ename)
                _error = error.content.ename
              if (error.content && error.content.evalue)
                _error += ': '+error.content.evalue
              this.currentCommand = {...this.currentCommand, error: _error, data: false, selection: []}
            }

            this.currentCommand.loading = false
          },
          payload: (columns) => {
            return {
              columns,
              algorithm: 'tukey',
              threshold: 1,
              valid: {
                algorithm: undefined,
                threshold: undefined
              },
              data: false,
              selection: [],
              action: 'Drop',
              loading: false,
              code_done: ''
            }
          },
          code: (payload) => {
            if ( ['z_score','modified_z_score'].includes(payload.algorithm) ) {
              return `${payload.code_done}${sl}outlier.${payload.action=='Drop' ? 'drop' : 'select'}()`
            }
            else {

              // TODO various ranges

              return payload.selection.map(selection=>`.rows.between(`
              +`"${payload.columns[0]}"`
              +`, lower_bound=${selection[0]}`
              +`, upper_bound=${selection[1]}`
              +`, invert=${payload.action=='Drop' ? 'True' : 'False'}`
              +')'
              ).join('\n')
            }
          }
        },
        'load from database': {
          dialog: {
            title: 'Connect a database',
            testLabel: 'connect',
            fields: [
              {
                key: 'driver',
                type: 'select',
                label: 'Driver',
                items: [
                  {text: 'MySQL', value: 'mysql'},
                  {text: 'Oracle Database', value: 'oracle'},
                  {text: 'PostgreSQL', value: 'postgres'},
                  {text: 'Apache Cassandra', value: 'cassandra'},
                  {text: 'SQLite', value: 'sqlite'},
                  {text: 'Amazon Redshift', value: 'redshift'},
                  {text: 'Presto', value: 'presto'},
                  {text: 'Microsoft SQL Server', value: 'sqlserver'},
                ]
              },
              {
                condition: (c)=>c.driver=='oracle',
                key: 'oracle_type',
                type: 'select',
                label: 'Type',
                items: [
                  {text: 'SID', value: 'oracle_sid'},
                  {text: 'Service name', value: 'oracle_service_name'},
                  {text: 'TNS', value: 'oracle_tns'},
                ]
              },
              {
                condition: (c)=>(c.driver=='oracle' && c.oracle_type=='oracle_sid'),
                key: 'oracle_sid',
                type: 'field',
                label: 'SID'
              },
              {
                condition: (c)=>(c.driver=='oracle' && c.oracle_type=='oracle_service_name'),
                key: 'oracle_service_name',
                type: 'field',
                label: 'Service name'
              },
              {
                condition: (c)=>(c.driver=='oracle' && c.oracle_type=='oracle_tns'),
                key: 'oracle_tns',
                type: 'field',
                label: 'TNS'
              },
              {
                condition: (c)=>(c.driver!='oracle' || c.oracle_type!='oracle_tns') && c.driver!='cassandra',
                key: 'host',
                type: 'field',
                label: 'Host'
              },
              {
                condition: (c)=>(c.driver!='oracle' || c.oracle_type!='oracle_tns') && c.driver!='cassandra',
                key: 'port',
                type: 'field',
                label: 'Port'
              },
              {
                condition: (c)=>(c.driver=='presto'),
                key: 'presto_catalog',
                type: 'field',
                label: 'Catalog'
              },
              {
                condition: (c)=>['postgres','presto','redshift','sqlserver','mysql'].includes(c.driver),
                key: 'database',
                type: 'field',
                label: 'Database'
              },
              {
                condition: (c)=>['postgres','redshift'].includes(c.driver),
                key: 'schema',
                type: 'field',
                label: 'Schema'
              },
              {
                condition: (c)=>(c.driver=='cassandra'),
                key: 'url',
                type: 'field',
                label: 'Url'
              },
              {
                condition: (c)=>(c.driver=='cassandra'),
                key: 'keyspace',
                type: 'field',
                label: 'Keyspace'
              },
              {
                key: 'user',
                type: 'field',
                label: 'User'
              },
              {
                key: 'password',
                type: 'password',
                label: 'Password',
                showable: true,
                show: false
              },
              {
                key: 'table',
                type: 'select',
                label: 'Table',
                items_key: 'tables'
              },
            ],
            validate: (command) => (
              command.table &&
              command.driver == command.validDriver /* &&
              command.host == command.validHost &&
              command.database == command.validDatabase
              */
            )
          },
          payload: () => ({
            command: 'load from database',
            _init: true,
            driver: 'mysql',
            host: '',
						database: '',
						user: '',
            password: '',
            loadingTest: false
          }),
          code: (payload) => {
            var table = escapeQuotes(payload.table)
            return `${payload.previous_code}${sl}${this.availableVariableName} = db.table_to_df("${table}").ext.cache()`
          },
          onTest: async (payload) => {

            this.currentCommand.loadingTest = true
            this.currentCommand.error = ''

            var fields = this.commandsPallete['load from database'].dialog.fields

            try {
              var driver = escapeQuotes(payload.driver)
              var code = `db = op.connect(driver="${driver}"`

              fields.forEach(field => {
                if (field.key!='driver' && field.key!='oracle_type' && field.key!='table') {
                  code += (
                    (!field.condition || field.condition(this.currentCommand) && payload[field.key]!==undefined) ?
                    `, ${field.key}="${escapeQuotes(payload[field.key])}"` : ''
                  )
                }
              });

              code += ')'

              var response = await this.evalCode(code+`; _output = db.tables_names_to_json()`)

              var tables = parseResponse(response.content)
              if (!tables.length) {
                throw 'Database has no tables'
              }

              this.$store.commit('database',true)

              this.currentCommand = {
                ...payload,
                tables,
                table: tables[0],
                previous_code: code,
                validDriver: payload.driver,
                validHost: payload.host,
                validDatabase: payload.database
              }
              this.currentCommand.loadingTest = false
            } catch (error) {

              printError(error)

              var _error = error

              if ( error.error)
                _error = error.error
              if (error.content.ename)
                _error = error.content.ename
              if (error.content.evalue)
                _error += ': '+error.content.evalue

              this.currentCommand = {...payload, error: _error}
              this.currentCommand.loadingTest = false
            }
          }
        },
        'save to server': {
          dialog: {
            title: 'Save file to server',
            fields: [
              {
                type: 'field',
                key: 'file_name',
                label: 'File name',
                placeholder: (c)=>`my_file.${c.format}`,
              },
              {
                type: 'select',
                key: 'format',
                label: 'Format',
                items: [
                  {text: 'CSV', value: 'csv'},
                  {text: 'Parquet', value: 'parquet'},
                  {text: 'JSON', value: 'json'}
                ]
              }
            ],
            validate: (c) => (c.file_name && c.format)
          },
          payload: () => ({
            command: 'save to server',
            format: 'csv',
            file_name: ''
          }),
          code: (payload) => {
            var file_name = escapeQuotes(payload.file_name)
            return `${this.dataset.varname}.save.${payload.format}("${file_name}")`
          }
        },
        'save to database': {
          dialog: {
            title: 'Save dataset to database',
            fields: [
              {
                type: 'field',
                key: 'table_name',
                label: 'Table name',
              }
            ],
            validate: (c) => (c.table_name)
          },
          payload: () => ({
            command: 'save to database',
            table_name: ''
          }),
          code: (payload) => {
            var table_name = escapeQuotes(payload.table_name)
            return `db.df_to_table(${this.dataset.varname}, table="${table_name}", mode="overwrite")`
          }
        },
        stratified_sample: {
          dialog: {
            title: 'Stratified sampling',
            fields: [
              {
                type: 'number',
                key: 'seed',
                label: 'Seed',
                clearable: true
              },
            ],
          },
          payload: (columns) => ({
            command: 'stratified_sample',
						seed: 1,
						columns: columns,
					}),
          code: (payload) => {
            var _argument = (payload.columns.length==1) ? `"${payload.columns[0]}"` : `["${payload.columns.join('", "')}"]`
            return `.ext.stratified_sample(`
              +_argument
              +( (payload.seed) ? `, seed=${payload.seed}` : '')
              +')'
          }
        },
        'replace values': {
          dialog: {
            text: 'Replace row values',
            fields: [
              // {
              //   type: 'chips',
              //   key: 'search',
              //   label: 'Find',
              //   clearable: true
              // },
              {
                type: 'field',
                key: 'replace',
                label: 'Replace'
              },
              // {
              //   type: 'select',
              //   key: 'search_by',
              //   label: 'Search by',
              //   items: [
              //     {text: 'Characters', value: 'chars'},
              //     {text: 'Words', value: 'words'}
              //   ]
              // },
            ],
          },
          payload: (columns) => ({
						command: 'replace',
						columns: columns,
            search: this.currentSelection.ranged.values,
            replace: '',
            title: 'Replace in column',
					}),
          code: (payload) => {
            payload = escapeQuotesOn(payload,['search','replace'])
            return `.cols.replace(`
              +`"${escapeQuotes(payload.columns[0])}"`
              +`, search=["${payload.search.join('","')}"]`
              +`, replace_by="${payload.replace}"`
              +`, search_by="full"`
              +')'
          }
        },
        replace: {
          dialog: {
            text: (command) => {
              return `Replace "${command.search}" by "${command.replace}"`
              + (command.columns.length==1 ? ` in ${command.columns[0]}` : '')
            },
            fields: [
              {
                type: 'chips',
                key: 'search',
                label: 'Find',
                clearable: true
              },
              {
                type: 'field',
                key: 'replace',
                label: 'Replace'
              },
              {
                type: 'select',
                key: 'search_by',
                label: 'Search by',
                items: [
                  {text: 'Characters', value: 'chars'},
                  {text: 'Words', value: 'words'}
                ]
              },
            ],
            output_cols: true,
            validate: (command) => (command.search.length>0 && command.output_cols.filter(e=>e!=='').length%command.columns.length===0)
          },
          payload: (columns) => ({
						command: 'replace',
						columns: columns,
            search: [],
            replace: '',
						search_by: 'chars',
            output_cols: columns.map(e=>e),
            title: 'Replace in ' + (columns.length==1 ? `column` : 'columns'),
            _preview: 'replace',
            _highlightColor: {default: 'red', preview: 'green'}
					}),
          code: (payload) => {
            var _argument = (payload.columns.length==1) ? `"${payload.columns[0]}"` : `["${payload.columns.join('", "')}"]`

            if (payload._requestType==='preview' || payload._requestType==='profile') {
              payload.output_cols = payload.output_cols.map(col=>'new '+col)
            }

            var output_cols_argument = getOutputColsArgument(payload.output_cols, payload.columns, (payload._requestType) ? 'new ' : '')

            payload = escapeQuotesOn(payload,['replace','search_by'])
            var search = payload.search.map(v=>escapeQuotes(v))

            return `.cols.replace(`
              +_argument
              +`, search=["${search.join('","')}"]`
              +`, replace_by="${payload.replace}"`
              +`, search_by="${payload.search_by}"`
              +( (output_cols_argument) ? `, output_cols=${output_cols_argument}` : '')
              +')'
              +( (payload._requestType==='preview') ? `.cols.find(${_argument}, sub=["${search.join('","')}"])` : '')
              +( (payload._requestType==='preview') ? `.cols.find(${output_cols_argument}, sub=["${payload.replace}"])` : '')
          }
        },
        set: {
          dialog: {
            fields: [
              {
                type: 'field',
                key: 'newName',
                label: 'New column name',
              },
              {
                type: 'field',
                key: 'expression',
								label: 'Expression',
								placeholder: '1+2 or "COLUMN / ANOTHER_COLUMN"'
              },
            ],
            validate: (command) => (command.newName!=='')
          },
          payload: (columns) => ({
            command: 'set',
            fromColumns: columns,
            expression: '', // (columns.length!=0) ? columns.map(e=>`df["${e}"]`).join(' + ') : '',
            title: 'Create column',
						_preview: 'set',
            newName: ''
          }),
          code: (payload) => {
            var newName = escapeQuotes(payload.newName)
            return `.cols.set("${newName}"`
            +( (payload.expression) ? `, ${payload.expression}` : '')
            +`)`
          }
        },
        rename: {
          dialog: {
            title: (command) => 'Rename '+(command.columns.length==1 ? `column` : 'columns'),
            output_cols: true,
            output_cols_label: true,
            no_label: true,
            validate: (command) => {
              return (command.output_cols.filter(e=>e!=='').length==command.columns.length)
            }
          },
          payload: (columns) => {
            return {
              command: 'rename',
              columns,
              output_cols: columns.map(e=>newName(e)),
              _fakePreview: 'rename'
            }
          },
          code: (payload) => {
            if (payload.columns.length==1) {
              return `.cols.rename("${payload.columns[0]}", "${payload.output_cols[0]}")`
            }
            else {
              return `.cols.rename([${payload.columns.map((e,i)=>`("${e}", "${payload.output_cols[i]}")`)}])`
            }
          }
        },
        unnest: {
          dialog: {
            title: (command) => 'Unnest '+(command.columns.length==1 ? `column` : 'columns'),
            output_cols: true,
            output_cols_label: 'Output columns name',
            fields: [
              {
                type: 'field',
                key: 'separator',
                label: 'Separator',
              },
              {
                type: 'number',
                key: 'splits',
                label: 'Splits',
                clearable: true,
                min: 2
              },
              {
                type: 'number_index',
                key: 'index',
                label: 'Index',
                clearable: true,
                min: 0,
              },
            ],
            validate: (command) => {
              return command.output_cols.filter(e=>e!=='').length%command.columns.length===0 && (command.splits==='' || command.splits>command.index) && command.separator!=''
            }
          },
          payload: (columns) => {
            return {
              command: 'unnest',
              columns,
              separator: ', ',
              splits: 2,
              index: '',
              drop: false,
              output_cols: columns.map(e=>e),
              _preview: 'unnest',
              _highlightColor: 'red'
            }
					},
					code: (payload) => {
            var _argument = (payload.columns.length==1) ? `"${payload.columns[0]}"` : `["${payload.columns.join('", "')}"]`
            var output_cols_argument = getOutputColsArgument(payload.output_cols, payload.columns, (payload._requestType) ? 'new ' : '')
            payload = escapeQuotesOn(payload, ['separator'])
            return `.cols.unnest(`
              +_argument
              +( (payload.separator) ? `, separator="${payload.separator}"` : '')
              +( (payload.splits) ? `, splits=${payload.splits}` : '')
              +( (payload.index) ? `, index=${payload.index}` : '')
              +( (output_cols_argument) ? `, output_cols=${output_cols_argument}` : '')
              +( (payload._requestType==='profile' || payload.drop) ? ', drop=True' : '')
              +')'
              +( (payload._requestType==='preview') ? `.cols.find(${_argument}, sub=["${payload.separator}"])` : '')
					}

        },
        nest: {
          dialog: {
            fields: [
              {
                type: 'field',
                key: 'separator',
                label: 'Separator',
              },
              {
                type: 'field',
                key: 'newName',
                label: 'Output column name',
                clearable: true,
              },
            ],
            validate: (command) => command.newName
          },
          payload: (columns) => {
            return {
              command: 'nest',
              columns,
              separator: ', ',
              title: 'Nest '+(columns.length==1 ? `column` : 'columns'),
              newName: '',
              _preview: 'nest',
              _highlightColor: {default: 'none', preview: 'green'}
					}
          },
					code: (payload) => {
            payload = escapeQuotesOn(payload,['separator','newName'])
            return `.cols.nest(["${payload.columns.join('", "')}"]`
						+( (payload.separator) ? `, separator="${payload.separator}"` : '')
            +`, output_col="${payload.newName}")`
            +( (payload._requestType==='preview' && payload.separator) ? `.cols.find("${payload.newName}", sub=["${payload.separator}"])` : '')
          }
        },
        duplicate: {
          dialog: {
            output_cols: true,
            validate: (command) => {
              return (command.output_cols.filter(e=>e!=='').length==command.columns.length)
            }
          },
          payload: (columns) => {
            return {
              command: 'duplicate',
              columns,
              title: 'Duplicate '+(columns.length==1 ? `column` : 'columns'),
              output_cols: columns.map(e=>newName(e)),
              _fakePreview: 'duplicate'
            }
          },
          code: (payload) => {
            var _argument = (payload.columns.length==1) ? `"${payload.columns[0]}"` : `["${payload.columns.join('", "')}"]`
            var output_cols_argument = getOutputColsArgument(payload.output_cols, payload.columns, (payload._requestType) ? 'new ' : '')
            return `.cols.copy(`
              +_argument
              +( (output_cols_argument) ? `, output_cols=${output_cols_argument}` : '')
              +')'
          }
        },
        bucketizer: {
          dialog: {
            title: 'Create Bins',
            output_cols: true,
            fields: [
              {
                type: 'number',
                key: 'splits',
                label: 'Splits',
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
          code: (payload) => {
            // df.cols.bucketizer("id",2,"buckets_output")
            var _argument = (payload.columns.length==1) ? `"${payload.columns[0]}"` : `["${payload.columns.join('", "')}"]`
            var output_cols_argument = getOutputColsArgument(payload.output_cols, payload.columns, (payload._requestType) ? 'new ' : '')

            return `.cols.bucketizer(`
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
          code: (payload) => {
            return `.cols.values_to_cols("${payload.columns[0]}")`
          }
        },
        string_to_index: {
          dialog: {
            title: 'Strings to Index',
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
          code: (payload) => {
            // cols.string_to_index(input_cols, output_cols=None)
            var _argument = (payload.columns.length==1) ? `"${payload.columns[0]}"` : `["${payload.columns.join('", "')}"]`

            var output_cols_argument = getOutputColsArgument(payload.output_cols, payload.columns, (payload._requestType) ? 'new ' : '')

            return `.cols.string_to_index(`
              + _argument
              + ( (output_cols_argument) ? `, output_cols=${output_cols_argument}` : '')
              + ')'
          },
        },
        index_to_string: {
          dialog: {
            title: 'Indices to Strings',
            output_cols: true,
            validate: (command) => {
              if (command.output_cols.filter(e=>e!=='').length%command.columns.length==0)
                return true
              return false
            }
          },
          payload: (columns) => {
            return {
              command: 'index_to_string',
              columns: columns,
              output_cols: columns.map(e=>'')
            }
          },
          code: (payload) => {
            // cols.index_to_string(input_cols, output_cols=None)
            var _argument = (payload.columns.length==1) ? `"${payload.columns[0]}"` : `["${payload.columns.join('", "')}"]`

            var output_cols_argument = getOutputColsArgument(payload.output_cols, payload.columns, (payload._requestType) ? 'new ' : '')

            return `.cols.index_to_string(`
              + _argument
              + ( (output_cols_argument) ? `, output_cols=${output_cols_argument}` : '')
              + ')'
          },
        },
        SCALER: {
          dialog: {
            title: (command) => {
              if (command.command=='z_score')
                return 'Standard scaler'
              if (command.command== 'min_max_scaler')
                return 'Min max scaler'
              if (command.command== 'max_abs_scaler')
                return 'Max abs scaler'
            },
            text: (command) => {
              return `Apply to ${arrayJoin(command.columns)}`
            },
            output_cols: true,
            validate: (command) => {
              if (command.output_cols.filter(e=>e!=='').length%command.columns.length==0)
                return true
              return false
            }
          },
          payload: (columns) => {
            return {
              columns: columns,
              output_cols: columns.map(e=>'')
            }
          },
          code: (payload) => {
            var _argument = (payload.columns.length==1) ? `"${payload.columns[0]}"` : `["${payload.columns.join('", "')}"]`

            var output_cols_argument = getOutputColsArgument(payload.output_cols, payload.columns, (payload._requestType) ? 'new ' : '')

            return `.cols.${payload.command}(`
              + _argument
              + ( (output_cols_argument) ? `, output_cols=${output_cols_argument}` : '')
              + ')'
          },
        },
        impute: {
          dialog: {
            title: 'Impute rows',
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
          code: (payload) => {
            // df.cols.impute(input_cols, data_type="continuous", strategy="mean", output_cols=None)
            var _argument = (payload.columns.length==1) ? `"${payload.columns[0]}"` : `["${payload.columns.join('", "')}"]`

            var output_cols_argument = getOutputColsArgument(payload.output_cols, payload.columns, (payload._requestType) ? 'new ' : '')

            return `.cols.impute(`
              + _argument
              + `, "${payload.data_type}"`
              + `, "${payload.strategy}"`
              + ( (output_cols_argument) ? `, output_cols=${output_cols_argument}` : '')
              + ')'
          },
        },
        sample_n: {
          dialog: {
            title: 'Sampling',
            fields: [
              {
                type: 'number',
                key: 'n',
                label: 'Number of samples',
                placeholder: 'Number of samples',
              },
            ],
            validate: (command) => {
              if (command.n)
                return true
              return false
            }
          },
          payload: (columns) => {
            return {
              command: 'sample_n',
              n: 10,
              columns: columns,
            }
          },
          code: (payload) => {
            return `.ext.sample(${payload.n})`
          },
        },
        /*
        random_split: {
          dialog: {
            title: 'Split train and test',
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
          code: (payload) => {
            return `${this.availableVariableName} = ${this.dataset.varname}.random_split(${payload.self}, weights=[${payload.weight1},${payload.weight2}], seed=${payload.seed})`
          }
        }
        */
      }
    }
  },

  computed: {

    ...mapGetters(['currentSelection','selectionType','currentTab', 'currentDuplicatedColumns', 'currentPreviewNames']),

    cells: {
      get() {
        return Array.from(this.$store.state.cells)
      },
      set(value) {
        this.$store.commit('cells', value)
      }
    },

    command () {
      try {
        return this.commandsPallete[this.currentCommand.command] || this.commandsPallete[this.currentCommand.type]
      } catch (error) {
        return undefined
      }
      // command.dialog && (currentCommand.command == key || currentCommand.type == key)
    },

    availableVariableName () {

      return 'df' // TODO: multiple dfs

      var found = this.$store.state.datasets.findIndex(e => {
        return (!e.summary)
      })

      if (found === -1) {
        found = this.$store.state.datasets.length
      }

      if (found>=1)
        return `df${found}`
      else
        return 'df'
    },

    dragOptions () {
      return {
        animation: 200,
        group: "description",
        disabled: this.commandsDisabled,
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
      async handler () {
        try {
          if (this.command && this.command.dialog && (!this.command.dialog.validate || this.command.dialog.validate(this.currentCommand))) {
            if (this.currentCommand._preview) {
              this.getPreview()
            }
            if (this.currentCommand._fakePreview==='rename') {
              var nameMap = {}
              this.currentCommand.output_cols.forEach((col, i) => {
                nameMap[this.currentCommand.columns[i]] = col
              })
              this.$store.commit('setPreviewNames',nameMap)
            } else if (this.currentCommand._fakePreview==='duplicate') {
              var duplicatedColumns = []
              this.currentCommand.output_cols.forEach((col, i) => {
                duplicatedColumns.push({name: this.currentCommand.columns[i], newName: col})
              })
              this.$store.commit('setDuplicatedColumns',duplicatedColumns.length ? duplicatedColumns : undefined)
            }
          } else {
            if (this.currentPreviewNames) {
              this.$store.commit('setPreviewNames',undefined)
            }
            if (this.currentDuplicatedColumns) {
              this.$store.commit('setDuplicatedColumns',undefined)
            }
          }
        } catch (error) {
          console.error(error)
        }
      }
    },

    dataset: {
      deep: true,
      handler () {
        if (this._commandsDisabled===undefined) {
          this._commandsDisabled = false
          this.markCells()
          this.$emit('update:codeError','')
          this.lastWrongCode = false
        }
      }
    },

  },

  methods: {

    cleanCodeError () {
      this.$emit('update:codeError','')
    },

    moveBarDelayed: debounce(async function(value) {
      this.moveBar(value)
    },300),

    async getPreview() {

      try {

        if (this.currentCommand._preview) {

          this.$store.commit('setPreviewCode',{
            code: this.getCode(this.currentCommand,'preview'),
            profileCode: this.getCode(this.currentCommand,'profile'),
            color: this.currentCommand._highlightColor,
            from: this.currentCommand.columns
          })

        }

      } catch (err) {
        // console.error(err) // probably just a cancelled request
      }


    },

    getCommandTitle() {
      try {
        if (this.command.dialog.title) {
          if (typeof this.command.dialog.title == 'function') {
            return this.command.dialog.title(this.currentCommand)
          }
          return this.command.dialog.title
        }
        return  this.currentCommand.title
      }
      catch {
        return 'Operation'
      }
    },

    clusterFieldUpdated(cluster) {
      if (cluster.selected.length==0) {
        cluster.selected = cluster.values
      }
    },

    codeText (n = false) {
      if (n)
        return (this.cells.length) ? (this.cells.filter(e=>(e.content!=='' && !e.done)).map(e=>e.content).join('\n').trim()) : ''
      else
        return (this.cells.length) ? (this.cells.filter(e=>(e.content!=='')).map(e=>e.content).join('\n').trim()) : ''
    },

    async commandHandle (event) {

			var payload = {}
			var columns = undefined

      if (!event.columns || !event.columns.length)
        columns = this.columns.map(e=>this.dataset.columns[e.index].name)
      else
        columns = event.columns

      var _command = this.commandsPallete[event.command] || this.commandsPallete[event.type]

      payload.type = event.type
      payload.command = event.command
      payload._noOperations = event.noOperations

      if (_command) {

        payload = (_command.payload) ? ( {..._command.payload(columns), ...payload} ) : payload

        if (_command.dialog) {

          this.currentCommand = {...payload, ...(event.payload || {})}

          this.$emit('updateOperations', { active: true, title: this.getCommandTitle() })
          this.$emit('update:big',_command.dialog.big) // :max-width="command.dialog.big ? 820 : 410"

          if (_command.onInit) {
            await _command.onInit()
          }

          if (event.immediate) {
            await this.confirmCommand()
          } else {
            setTimeout(() => {
              var ref = this.$refs['command-form'] && this.$refs['command-form'][0]
              if (ref && ref.$el) {
                var el = ref.$el.getElementsByTagName('input')[0]
                if (el)
                  el.focus()
              }
            }, 100);
          }
        }
        else {

          var cell = {
            ...event,
            columns: payload.columns || columns,
            payload
          }
          this.addCell(-1, event.command, this.getCode(cell,false))
          this.runButton = false
        }
      }
    },

    async confirmCommand () {
      var _command = this.commandsPallete[this.currentCommand.command] || this.commandsPallete[this.currentCommand.type]
      if (_command.onDone) {
        this.currentCommand = await _command.onDone(this.currentCommand)
      }
      var code = this.getCode(this.currentCommand, false)
      this.addCell(-1, this.currentCommand.command, code )
      this.runButton = false

      this.$emit('updateOperations', { active: (this.currentCommand._noOperations ? false : true), title: 'operations' } )

      this.currentCommand = false
      this.$store.commit('previewDefault')
    },

    cancelCommand () {
			setTimeout(() => {
        this.currentCommand = false
        this.$emit('updateOperations', {
          active: false,
          title: 'operations'
        })
        this.$store.commit('previewDefault')
			}, 10);
    },

    setActiveCell (index, delayed = false) {

      if (this.cells[index]) {
        this.activeCell = index
        if (this.$refs.cells) {
          this.moveBar(this.$refs.cells.$el.getElementsByClassName('cell-container')[index].offsetTop+11)
        }
      }
      else {
        this.activeCell = -1
        this.moveBar(12)
      }

    },

    moveBarDelayed: debounce(async function(value) {
      this.moveBar(value)
    },300),

    moveBar (value) {
      this.barTop = value;
      if (!this.barHovered) {
        this.moveBarNow(value)
      }
    },

    moveBarNow(value) {
      if (this.$refs.cells.$el) {
        this.$refs.cells.$el.style.minHeight = value+27 + 'px'
      }

      if (this.$refs['cells-controls']) {
        this.$refs['cells-controls'].style.top = value + 'px'
      }
    },

    draggableEnd() {
      if (this.codeText().trim()==='') {
        this.runButton = false
        this.$emit('update:codeError','')
        this.runCode() // deleting every cell
        return;
      }
      if (!this.runButton) {
        this.runCode() // reordering or deleting
        return;
      }
    },

    // draggableMove({ relatedContext, draggedContext }) {
    //   const relatedElement = relatedContext.element;
    //   const draggedElement = draggedContext.element;
    //   return (
    //     (!relatedElement || !relatedElement.fixed) && !draggedElement.fixed
    //   );
    // },

    removeCell (index) {

      this.runButton = false

      var permanentCells = ['load file', 'load from database']

      if (permanentCells.includes(this.cells[index].command) && this.cells.filter(e => permanentCells.includes(e.command) ).length<=1) {
        if (this.cells.length>1) {
          return
        }
      }

      if (index<0) {
        return
      }
      this.$emit('update:codeError','')

      var cells = this.cells
      cells.splice(index,1)
      this.cells = cells
      if (this.cells.length==index) {
        index--
      }

      this.setActiveCell(index, true)

      if (this.cells.length==0)
        this.$store.commit('resetDataset')
        this.codeDone = ''

      this.draggableEnd()
    },

    markCells(mark = true) {
      var cells = [...this.cells]
      for (let i = 0; i < this.cells.length; i++) {
        if (cells[i].content) {
          cells[i].done = mark
        }
        cells[i].error = false
      }
      this.cells = cells

      if (mark && this.cells)
        this.codeDone = this.cells.map(e=>e.content).join('\n').trim()
      else
        this.codeDone = ''
    },

    markCellsError() {
      var cells = [...this.cells]
      for (let i = 0; i < cells.length; i++) {
        if (!cells[i].done && cells[i].content)
          cells[i].error = true
      }
      this.cells = cells

      if (this.cells)
        this.codeDone = this.cells.map(e=>e.content).join('\n').trim()
      else
        this.codeDone = ''
    },

    getCode (payload, type) {

      var content = ''

      if (!payload.columns || !payload.columns.length) {
        payload.columns = this.columns.map(e=>this.dataset.columns[e.index].name)
      }

      if (!payload.content) {
        var _command = this.commandsPallete[payload.command] || this.commandsPallete[payload.type]
        if (_command) {
          content = _command.code ? _command.code({...payload, _requestType: type}) : ''
        }
      }
      else {
        content = payload.content
      }

      if (payload._init) {
        return content
      }

      if (type==='preview') {
        return content
      } else if (type==='profile') {
        return content
      }
      else {
        return `${this.dataset.varname} = ${this.dataset.varname}${content}`
      }


    },

    addCell (at = -1, command = 'code', code = '') {

      this.$emit('update:codeError','')

      if (at==-1)
        at = this.cells.length

      var cells = [...this.cells]

      cells.splice(at,0, {
        command,
        content: code,
        id: Number(new Date()),
        active: false
      })

      this.cells = cells

      this.$nextTick(()=>{
        if (this.activeCell<0)
          this.setActiveCell(0)
        if (code.length)
          this.runCode()
      })

    },



    async runCodeNow (force = false) {

      var code = this.codeText()
      var codeDone = this.codeDone.trim()
      var rerun = false

      if (code==='') {
        return
      }

      if (code === codeDone) {
        return;
      }
      else if (
        ( !this.firstRun && (force || code.indexOf(codeDone)!=0 || codeDone=='' || this.lastWrongCode) )
        ||
        !this.socketAvailable
      ) {
        rerun = true
      }
      else {
        code = this.codeText(true) // new cells only
      }

      if (code===this.lastWrongCode) {
        return;
      }

      if (rerun) {
				this.markCells(false)
      }

			if (this.firstRun) {
				this.firstRun = false
				rerun = false
			}

      this._commandsDisabled = true;

      try {
        var response = await this.socketPost('cells', {
          code,
          name: this.dataset.summary ? this.dataset.name : null,
          session: this.$store.state.session,
          key: this.$store.state.key
        }, {
          timeout: 0
        })

        console.log('"""[DEBUG][CODE]"""',response.code)

        this._commandsDisabled = false;

        if (response.status!=='ok') {
          throw response
        }

        this.$store.commit('add', {
          dataset: response.data.result
        })

        this.$forceUpdate()
        this.markCells()

        this.$emit('update:codeError','')
        this.lastWrongCode = false

      } catch (error) {
        printError(error)
        var codeError = (error.error) ? error.error : error
        if (codeError && codeError.split) codeError = codeError.split("\n")[0]
        this.$emit('update:codeError',codeError)

        this.markCellsError()
        this.lastWrongCode = code
        this._commandsDisabled = undefined;
      }

      if (this.codeText() !== code) {
        this.runCodeNow(false)
      }

    },

    runCode: debounce(async function(force = false) {
      this.runCodeNow(force)
    },1000),
  }
}
</script>
