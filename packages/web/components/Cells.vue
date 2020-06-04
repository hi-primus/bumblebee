<template>
  <div class="sidebar-content">
    <CommandFormContainer
      v-if="command && command.dialog"
      v-show="(currentCommand.command && view!='operations')"
      :currentCommand="currentCommand"
      :command="command"
      @cancelCommand="cancelCommand"
    >
      <v-form @submit.prevent="confirmCommand" id="operation-form" class="pl-4 pr-5 pt-2 operation-form">
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
              v-if="currentCommand.loading"
            />
          </div>
          <div class="o-fields">
            <template v-if="!currentCommand.loading && command.dialog.fields">
              <template v-for="field in command.dialog.fields.filter(f=>(!f.condition || f.condition && f.condition(currentCommand)))">

                <OperationField
                  v-if="getProperty(field.type,[currentCommand])!='repeat'"
                  :key="field.key"
                  :value.sync="currentCommand[field.key]"
                  :field="field"
                  :command="command"
                  :currentCommand="currentCommand"
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
                      />
                    </template>
                    <v-btn depressed class="icon-btn" :key="'remove'+i+field.key" color="error" @click="field.removeOne(currentCommand, i)">
                      <v-icon>close</v-icon>
                    </v-btn>
                  </template>
                  <v-btn
                    :key="'addNewRepeat'+field.key"
                    outlined
                    rounded
                    style="margin-left: auto; margin-right: auto; margin-top: -4px"
                    class="icon-btn"
                    color="primary"
                    @click="field.addOne(currentCommand)"
                  >
                    <v-icon>add</v-icon>
                  </v-btn>
                </template>
              </template>
            </template>
            <OutputColumnInputs v-if="command.dialog.output_cols" :fieldLabel="command.dialog.output_cols_label" :noLabel="!command.dialog.output_labels" :currentCommand.sync="currentCommand"></OutputColumnInputs>
            <template>
              <v-alert key="error" type="error" class="mt-3" dismissible v-if="currentCommand.error"  @input="currentCommand.error=''">
                {{currentCommand.error}}
              </v-alert>
            </template>
          </div>
          <div class="o-results pb-2" v-if="currentPreviewInfo">
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
          </div>
          <div class="o-buttons">
            <template v-if="command.dialog.filteredPreview">
              <v-checkbox
                class="filter-results-checkbox"
                v-model="currentCommand.filteredPreview"
                :label="`Filter results: ${currentCommand.filteredPreview ? 'Yes' : 'No'}`"
              ></v-checkbox>

            </template>
            <v-spacer></v-spacer>
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
              form="operation-form"
            >
              {{
                {value: (command.dialog.acceptLabel || 'Accept'), args: [currentCommand]} | property
              }}
            </v-btn>
          </div>
          <div class="o-error">
            <v-tooltip transition="fade-transition" left content-class="bar-tooltip" color="primary">
              <template v-slot:activator="{on}">
                <transition :duration="210" name="bounce">
                  <v-icon class="primary error-badge" v-on="on" v-if="previewError">
                    warning
                  </v-icon>
                </transition>
              </template>
              <span>{{previewError}}</span>
            </v-tooltip>
          </div>
      </v-form>
    </CommandFormContainer>
    <!-- <div
      persistent
      v-if="command && command.dialog"
      v-show="(currentCommand.command)"
      ref="operation-form"
      @click:outside="cancelCommand"
      @keydown.esc="cancelCommand"
    >
    </div> -->
    <div
      v-show="view=='operations'"
      class="sidebar-content operations-cells-container"
      :class="{'empty': !cells.length, 'controls': seeCode}"
      ref="cells-container"
    >
      <draggable
        tag="div"
        class="operations-cells"
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
          v-for="(cell, index) in cells"
          :key="cell.id"
          :class="{'fixed-cell': cell.fixed, 'cell-error': cell.error,'done': cell.done,'active': activeCell==index}"
          @click="setActiveCell(index)"
        >
          <div class="cell">
            <div class="handle left-handle">
              <v-icon>drag_indicator</v-icon>
            </div>
            <template v-if="seeCode">
              <CodeEditor
                :active="activeCell==index"
                @update:active="setActiveCell(index)"
                @input="$store.commit('setCellCode',{index, code: $event}); runButton = true"
                :value="cell.code"
              />
              <div class="cell-type cell-type-label" v-if="cell.command && cell.command!='code'">{{cell.command}}</div>
            </template>
            <template v-else>
              <div
                class="handle operation-hint-text"
                @click="editCell(cell, index)"
                v-html="cell.content || cell.code"
              >
              </div>
              <v-icon
                class="right-cell-btn"
                small
                @click="removeCell(index)"
              >close</v-icon>
            </template>
          </div>
        </div>
      </draggable>
      <v-alert key="error" type="error" class="mt-3" dismissible v-if="codeError!=''"  @input="cleanCodeError">
        {{codeError}}
      </v-alert>
      <div v-if="seeCode" key="controls" ref="cells-controls" class="cells-controls toolbar vertical" :class="{'disabled': commandsDisabled}" @mouseover="barHovered = true" @mouseleave="barHovered = false">
        <v-btn v-if="cells.length" text class="icon-btn" color="#888" @click.stop="removeCell(activeCell)">
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
import CommandFormContainer from '@/components/CommandFormContainer'
import OutputColumnInputs from '@/components/OutputColumnInputs'
import Outliers from '@/components/Outliers'
import OperationField from '@/components/OperationField'
import clientMixin from '@/plugins/mixins/client'
import { mapGetters } from 'vuex'
import {
  capitalizeString,
  printError,
  parseResponse,
  debounce,
  newName,
  arrayJoin,
  getOutputColsArgument,
  parseExpression,
  escapeQuotes,
  escapeQuotesOn,
  getProperty,
  namesToIndices,
  spanClass,
  multipleContent,
  hlParam,
  everyRatio,
  hlCols
} from '@/utils/functions.js'

import { TYPES, STRING_TYPES } from '@/utils/constants.js'

export default {

  components: {
    CommandFormContainer,
    CodeEditor,
		OutputColumnInputs,
		OperationField,
		Outliers
  },

  mixins: [clientMixin],

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

      seeCode: false,

      firstRun: true,
      runButton: false,

      cancelPromise: {},

      commandsHandlers: {
        'apply sort': {
          code: (payload) => {
            return `.cols.sort(["${payload.columns.join('", "')}"])`
          },
          content: (payload) => {
            return `<b>Reorder</b> columns`
          }
        },
        DROP_KEEP: {
          code: (payload) => {
            return `.cols.${payload.command}(["${payload.columns.join('", "')}"])`
          },
          content: (payload) => `<b>${capitalizeString(payload.command)}</b> ${multipleContent([payload.columns],'hl--cols')}`
        },
        'sort rows': {
          dialog: {
            title: 'Sort rows',
            text: (c) => {
              return `Sort rows in ${arrayJoin(c.columns)}`
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
          },
          content: (payload) => {
            return `<b>Sort rows</b> in ${multipleContent([payload.columns, payload.orders],['hl--cols','hl--param'])}`
          }
        },
        REMOVE_KEEP_SET: {
          dialog: {
            title: (c)=>`Filter / Set ${c.rowsLabels[c.rowsType]}`,
            fields: [
              {
                key: 'action',
                label: 'Action',
                type: 'select',
                items: (c) => {
                  var rt = c.rowsLabels[c.rowsType]
                  var al = c.actionLabels
                  return [
                    {text: `${al.drop} ${rt}`, value: 'drop'},
                    {text: `${al.select} ${rt}`, value: 'select'},
                    {text: `${al.set} ${rt}`, value: 'set'},
                  ]
                }
              },
              {
                condition: (c)=>c.action==='set',
                key: 'value',
                placeholder: 'Expression or value',
                label: 'Value',
                type: 'field',
                mono: true
              },
            ],
            filteredPreview: true,
          },
          payload: (columns, payload = {}) => {

            var rowsType = 'missing'

            return {
              columns,
              action: 'drop',
              value: '',
              selection: [],

              allColumns: this.allColumns,

              previewType: 'REMOVE_KEEP_SET',
              filteredPreview: false,
              noBufferWindow: (c)=>c.filteredPreview,
              highlightColor: (c)=>c.action==='drop' ? 'red' : 'green',
              _expectedColumns: () => +(this.currentCommand.action==='set'),
              _isString: payload.columnDataTypes && payload.columnDataTypes.every(d=>STRING_TYPES.includes(d)),

              rowsType: 'missing', // missing / mismatch / values / ranges
              actionLabels: {
                drop: 'Remove',
                select: 'Keep',
                set: 'Set'
              },
              rowsLabels: {
                missing: 'missing rows',
                mismatch: 'mismatch rows',
                values: 'matching rows',
                ranges: 'matching rows',
              }
            }
          },
          code: (payload) => {

            var varname = this.dataset.varname

            if (payload._requestType) {
              // varname = `${varname}.ext.get_buffer()`
              varname = `df`
            }

            if (payload.rowsType==='values' && payload.selection && payload.selection.map) {
              payload.selection = payload.selection.map(v=>escapeQuotes(v))
            }
            if (payload._isString) {
              if (payload.selection && payload.selection.map && payload.rowsType==='values') {
                payload.selection = payload.selection.map(v=>`"${v}"`)
              }
            }

            var expression = ''

            switch (payload.rowsType) {
              case 'missing':
                expression = `${varname}["${payload.columns[0]}"].isnull()`
                break
              case 'mismatch':
                expression = `~${varname}.cols.is_match("${payload.columns[0]}", "${payload.columnDataTypes[0]}")`

                break;
              case 'values':
                expression = `${varname}["${payload.columns[0]}"].isin([${payload.selection.join(',')}])`
                break
              case 'ranges':
                if (payload.selection.length>1) {
                  expression = '('
                  +payload.selection.map(range=>`(${varname}["${payload.columns[0]}"]>=${range[0]}) & (${varname}["${payload.columns[0]}"]<=${range[1]})`).join(' | ')
                  +')'
                } else {
                  expression = `(${varname}["${payload.columns[0]}"]>=${payload.selection[0][0]}) & (${varname}["${payload.columns[0]}"]<=${payload.selection[0][1]})`
                }
                break
              default:
                break;
            }

            if (payload.action==='set') {
              // payload.value = parseExpression(payload.value, 'df', payload.allColumns)
              var output_col = payload.columns[0]
              var code = ''
              if (payload._requestType) {
                output_col = 'new '+output_col
                code = `.rows.find( '${expression}' )`
                if (payload.filteredPreview) {
                  code += `.rows.select( 'df["__match__"]==True' )`
                }
                code += `.cols.set( default="${payload.columns[0]}", value='${payload.value || 'None'}', where='df["__match__"]==True', output_cols=["${output_col}"] )`
                if (payload._requestType==='preview' && payload.filteredPreview) {
                  return (from, to)=>code+(from!==undefined ? `[${from}:${to}]` : '')
                }
                return code
              }
              return code + `.cols.set( default="${payload.columns[0]}", value='${payload.value || 'None'}', where='${expression}', output_cols=["${output_col}"] )`

            } else {
              if (payload._requestType) {
                var code = `.rows.find( '${expression}' )`
                if (payload.filteredPreview) {
                  code += `.rows.select( 'df["__match__"]==True' )`
                }
                if (payload._requestType==='preview' && payload.filteredPreview) {
                  return (from, to)=>code+(from!==undefined ? `[${from}:${to}]` : '')
                }
                return code
              } else {
                return `.rows.${payload.action}( '${expression}' )` // rows.select rows.drop
              }

            }


          },
          content: (payload) => {

            var values = payload.selection
            var str = ''

            var rt = payload.rowsLabels[payload.rowsType]
            var al = payload.actionLabels[payload.action]
            var str = `<b>${al}</b>`

            var cols = multipleContent([payload.columns],'hl--cols')

            switch (payload.rowsType) {
              case 'ranges':
                values = payload.selection[0].map((col, i) => payload.selection.map(row => row[i]))
                str += ` rows where ${cols} is between ${multipleContent(values || [],'hl--param', ', ', ' and ', false, false)}`
                break;
              case 'values':
                if (values.length>1) {
                  str += ` rows where ${cols} is one of ${multipleContent([values || []],'hl--param')}`
                } else  {
                  str += ` rows where ${cols} is ${multipleContent([values || []],'hl--param')}`
                }
                break;
              case 'missing':
                str += ' missing rows on '+cols
                break;
              case 'mismatch':
                str += ' mismatch rows on '+cols
                break;
              default:
                break;
            }

            if (payload.action==='set') {
              str += ` to ${hlParam(payload.value)}`
            }

            return str
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
                items: (c)=>[
                  { text: 'Is exactly', value: 'exactly' },
                  { text: 'Is one of', value: 'oneof' },
                  { text: 'Is not', value: 'not' },
                  { divider: true },
                  { text: 'Less than or equal to', value: 'less', disabled: c._isString },
                  { text: 'Greater than or equal to', value: 'greater', disabled: c._isString  },
                  { text: 'Is Between', value: 'between', disabled: c._isString  },
                  { divider: true },
                  { text: 'Contains', value: 'contains' },
                  { text: 'Starts with', value: 'startswith' },
                  { text: 'Ends with', value: 'endswith' },
                  { divider: true },
                  { text: 'Custom expression', value: 'custom' },
                  { text: 'Selected', value: 'selected', disabled: true },
                  { divider: true },
                  { text: 'Mismatches values', value: 'mismatch' },
                  { text: 'Null values', value: 'null' }
                ]
              },
              {
                condition: (c)=>['exactly','not','less','greater'].includes(c.condition),
                key: 'value',
                placeholder: (c)=>(c._isString) ? 'Value' : 'numeric or "string"',
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
                placeholder: 'column>=0',
                type: 'field',
                mono: true
              },
              {
                condition: (c)=>['contains','startswith','endswith'].includes(c.condition),
                key: 'text',
                label: 'Text',
                placeholder: 'lorem ipsum',
                type: 'field',
                // disabled: {valueOf: ()=>['text'].includes(this.selectionType)}
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
            filteredPreview: true,
            validate: (c) => {

              // this.currentCommand.highlightColor = (c.action==='select') ? 'green' : 'red'

              switch (c.condition) {
                case 'oneof':
                  return (c.values.length)
                case 'exactly':
                case 'not':
                case 'less':
                case 'greater':
                  return (c.value.length)
                case 'between':
                  return (c.value.length && c.value_2.length)
                case 'contains':
                case 'startswith':
                case 'endswith':
                  return (c.text.length)
                case 'custom':
                  return (c.expression.length)
                case 'selected':
                case 'null':
                case 'mismatch':
                  return true
                default:
                  return false
              }
            }
          },

          payload: (columns, payload = {}) => {

            var condition = 'exactly'

            return {
              allColumns: this.allColumns,
              columns,
              condition,
              action: 'select',
              value: '',
              value_2: '',
              values: [],
              text: '',
              expression: `${columns[0]}`,

              _isString: payload.columnDataTypes && payload.columnDataTypes.every(d=>STRING_TYPES.includes(d)),

              previewType: 'filter rows',
              filteredPreview: false,
              noBufferWindow: (c)=>c.filteredPreview,
              highlightColor: (c)=>c.action==='drop' ? 'red' : 'green',
              _expectedColumns: 0
            }
          },

          code: (payload) => {

            var expression = payload.expression
            var varname = this.dataset.varname

            if (payload._requestType) {
              // varname = `${varname}.ext.get_buffer()`
              varname = `df`
            }
            // expression = parseExpression(expression, varname, payload.allColumns)

            try {
              payload = escapeQuotesOn(payload, ['text','selection'])
            } catch (error) {
              console.error(error)
            }

            if (payload._isString) {
              payload.value = `"${payload.value}"`
              payload.values = payload.values.map(v=>`"${v}"`)
            }

            switch (payload.condition) {
              case 'null':
                expression = `${varname}["${payload.columns[0]}"].isnull()`
                break
              case 'mismatch':
                expression = `~${varname}.cols.is_match("${payload.columns[0]}", "${payload.columnDataTypes[0]}")`
                break
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
              case 'custom':
              default:
            }
            if ( payload._requestType ) {
              var code = `.rows.find( '${expression}' )`
              if (payload.filteredPreview) {
                code += `.rows.select( 'df["__match__"]==True' )`
                if (payload._requestType==='preview') {
                  return (from, to)=>code+(from!==undefined ? `[${from}:${to}]` : '')
                }
              }
              return code
            } else {
              return `.rows.${payload.action}( '${expression}' )`
            }
          },
          content: (payload) => {

            var condition
            var value = undefined
            var action = payload.action=='drop' ? 'Drop' : 'Keep'
            var str = `<b>${action}</b> rows where ${multipleContent([payload.columns],'hl--cols')} `

            condition = payload.condition

            switch (condition) {
              case 'null':
                condition = 'is null'
                value = false
                break
              case 'mismatch':
                condition = 'is mismatch'
                value = false
                break
              case 'exactly':
                condition = 'is exactly '
                break
              case 'oneof':
                condition = 'is in '
                value = payload.values
                break
              case 'not':
                condition = 'is not '
                break
              case 'less':
                condition = 'is less than or equal to '
                break
              case 'greater':
                condition = 'is greater than or equal to '
                break
              case 'contains':
                condition = 'contains '
                value = [payload.text]
                break
              case 'startswith':
                condition = 'starts with '
                value = [payload.text]
                break
              case 'endswith':
                condition = 'ends with '
                value = [payload.text]
                break
              case 'between':
                value = value || [[payload.value],[payload.value_2]]
                break
              case 'custom':
                condition = 'matches '
                value = payload.expression
            }

            value = (value!==false) ? (value || payload.value) : false

            switch (condition) {
              case 'oneof':
                str += 'is one of '+multipleContent([value || []],'hl--param')
                break
              case 'between':
                str += 'is between '+multipleContent([value || []],'hl--param')
                break
              default:
                str += condition + ( value!==false ? multipleContent([value || []],'hl--param') : '')
            }
            return str
          }
        },
        'drop empty rows': {
          dialog: {
            title: (command) => (command.subset.length) ? 'Drop empty rows in subset' : 'Drop empty rows',
            fields: [
              {
                key: 'how',
                label: 'Drop when',
                type: 'select',
                items: [
                  { text: 'Every cell is null', value: 'all' },
                  { text: 'Any cell is null', value: 'any' }
                ]
              }
            ],
            filteredPreview: true
          },
          payload: (columns) => ({
            subset: columns,
            how: 'all',
            previewType: 'drop empty rows',
            highlightColor: 'red',
            filteredPreview: false,
            noBufferWindow: (c)=>c.filteredPreview
          }),
          code: (payload) => {
            if (payload._requestType) {
              var code = `.rows.tag_nulls(`
              + (payload.subset.length ? `subset=["${payload.subset.join('", "')}"], ` : '')
              + `how="${payload.how}", output_col="__match__" )`
              if (payload.filteredPreview) {
                code += `.rows.select( 'df["__match__"]==True' )`
                if (payload._requestType==='preview') {
                  return (from, to)=>code+(from!==undefined ? `[${from}:${to}]` : '')
                }
              }
              return code
            }
            return  `.rows.drop_na(`
              + (payload.subset.length ? `subset=["${payload.subset.join('", "')}"], ` : '')
              + `how="${payload.how}")`
          },
          content: (payload) => {
            var str = payload.how==='all' ? `<b>Drop empty rows</b>` : `<b>Drop rows with empty values</b>`
            return str+(payload.subset.length ? ` in ${multipleContent([payload.subset],'hl--cols')}` : '')
          }

        },
        'drop duplicates': {
          dialog: {
            title: (command) => (command.subset.length) ? 'Drop duplicates using subset' : 'Drop duplicates',
            fields: [
              {
                key: 'keep',
                label: 'Keep',
                type: 'select',
                items: [
                  { text: 'First match', value: 'first' },
                  { text: 'Last match', value: 'last' }
                ]
              }
            ],
            filteredPreview: true
          },
          payload: (columns) => ({
            subset: columns,
            keep: 'first',
            previewType: 'drop duplicates',
            highlightColor: 'red',
            filteredPreview: false,
            noBufferWindow: (c)=>c.filteredPreview
          }),
          code: (payload) => {
            if (payload._requestType) {
              var code = `.rows.tag_duplicated(`
              + (payload.subset.length ? `subset=["${payload.subset.join('", "')}"], ` : '')
              + `keep="${payload.keep}", output_col="__match__")`
              if (payload.filteredPreview) {
                code += `.rows.select( 'df["__match__"]==True' )`
                if (payload._requestType==='preview') {
                  return (from, to)=>code+(from!==undefined ? `[${from}:${to}]` : '')
                }
              }
              return code
            }
            return `.rows.drop_duplicates(`
              + (payload.subset.length ? `subset=["${payload.subset.join('", "')}"], ` : '')
              + `keep="${payload.keep}")`
          },
          content: (payload) => `<b>Drop duplicated rows</b>`+(payload.subset.length ? ` in ${multipleContent([payload.subset],'hl--cols')}` : '')

        },
        join: {
          dialog: {
            title: 'Join datasets',
            fields: [
              {
                key: 'how',
                label: 'Join type',
                type: 'select',
                items: [
                  { text: 'Inner join', value: 'inner' },
                  { text: 'Left join', value: 'left' },
                  { text: 'Right join', value: 'right' },
                  { text: 'Outer join', value: 'outer' }
                ]
              },
              {
                key: 'with',
                label: 'Dataset (right)',
                type: 'select',
                items_key: 'items_with',
                onChange: (event)=>{
                  for (let i = this.currentCommand.selected_columns.length-1; i >= 0; i--) {
                    if (this.currentCommand.selected_columns[i].source==='right') {
                      this.currentCommand.selected_columns.splice(i,1)
                    }
                  }
                  this.currentCommand.right_on = false

                  this.$nextTick(()=>{
                    this.currentCommand.selected_columns = [
                      ...this.currentCommand.selected_columns,
                      ...(this.currentCommand._datasets_right[this.currentCommand.with] || []).map(n=>({name: n, source: 'right', key: n+'r'}))
                    ]
                    var items = getProperty(this.currentCommand.items_r_on,[this.currentCommand])
                    this.currentCommand.right_on = items ? (items[0] || false) : false
                  })
                }
              },
              {
                key: 'selected_columns',
                label: 'Filter columns',
                item_key: 'key',
                type: 'columns_filter',
                items_key: 'items_selected_columns',
                headers: [
                  {
                    text: '',
                    sortable: false,
                    align: 'center',
                    class: 'pa-0',
                    value: 'key',
                    width: 12
                  },
                  {
                    text: 'Column',
                    sortable: true,
                    align: 'start',
                    value: 'name'
                  },
                  {
                    text: 'Source',
                    value: 'source'
                  }
                ],
                onClickRow: (item)=>{
                  var found = this.currentCommand.selected_columns.findIndex(it=>it.key===item.key)
                  if (found===-1) {
                    this.currentCommand.selected_columns.push(item)
                  } else {
                    this.$delete(this.currentCommand.selected_columns, found)
                  }
                },
                selectKey: (item)=>{

                  try {
                    var on = item.source+'_on'
                    this.currentCommand[on] = item.name
                  } catch (error) {
                    console.error(error)
                  }

                }
              },
            ],
            validate: (c) => {
              return !!(c.selected_columns && c.selected_columns.length && c.right_on)
            }
          },
          payload: async (columns) => {

            var _datasets_right = {...this.currentSecondaryDatasets}
            var items_with = Object.keys(_datasets_right).filter(e=>(e!==this.dataset.varname && e!=='preview_df'))

            var df2 = items_with[0]

            return {
              how: 'inner',
              _datasets_right,
              _unselect_on_change: {
                left: [],
                right: []
              },
              left_on: this.allColumns[0],
              items_l_on: this.allColumns,
              right_on: _datasets_right[df2][0],
              items_r_on: (c)=>c._datasets_right[c.with],
              with: df2,
              items_with: (c)=>{
                return Object.keys(c._datasets_right)
                  .filter(e=>e!==this.dataset.varname && e!=='preview_df')
                  .filter(e=>!e.startsWith('_'))
              },
              items_selected_columns: (c)=>{
                try {
                  return [
                    ...(this.allColumns || []).map(n=>({name: n, source: 'left', key: n+'l'})),
                    ...(c._datasets_right[c.with] || []).map(n=>({name: n, source: 'right', key: n+'r'}))
                  ]
                } catch (err) {}
              },
              selected_columns: [
                ...(this.allColumns || []).map(n=>({name: n, source: 'left', key: n+'l'})),
                ...(_datasets_right[df2] || []).map(n=>({name: n, source: 'right', key: n+'r'}))
              ],
              joinPreview: (c)=>{
                // var left = c.selected_columns.filter(col=>col.source==='left' || col.name===c.left_on).map(col=>col.name)
                // var right = c.selected_columns.filter(col=>col.source==='right' || col.name===c.right_on).map(col=>col.name)
                // var center = left.filter(col=>right.indexOf(col)!=-1)
                var left = c.selected_columns.filter(col=>col.source==='left' && col.name!==c.left_on).map(col=>col.name)
                left = [...left, ...left.map(n=>n+'_left')]
                var right = c.selected_columns.filter(col=>col.source==='right' && col.name!==c.right_on).map(col=>col.name)
                right = [...right, ...right.map(n=>n+'_right')]
                var center = [c.left_on, c.right_on, c.left_on+c.right_on, c.left_on+'_'+c.right_on]
                return [ left, center, right ]
              },
              previewType: 'join',
              // _previewDelay: 500,
              _expectedColumns: -1,
              datasetPreview: true,
              // noBufferWindow: true
            }
          },
          code: (payload) => {
            var columnsLeft = payload.selected_columns.filter(c=>c.source==='left').map(c=>c.name)
            var columnsRight = payload.selected_columns.filter(c=>(c.name && c.source==='right')).map(c=>c.name)

            var columnsLeftEnd = Array.from(columnsLeft)
            var columnsRightEnd = Array.from(columnsRight)

            for (const index in columnsLeftEnd) {
              var found = columnsRightEnd.indexOf(columnsLeftEnd[index])
              if (found<0 || (columnsLeftEnd[index]==payload.left_on && columnsRightEnd[found]==payload.right_on) ) {
                continue
              }
              columnsLeftEnd[index] = columnsLeftEnd[index]+'_left'
              columnsRightEnd[found] = columnsRightEnd[found]+'_right'
            }

            var columnsEnd = [...new Set([...columnsLeftEnd, ...columnsRightEnd])]

            var filterEnd = `.cols.select(["${columnsEnd.join('", "')}"])`
            // var filterEnd = ``

            if (columnsLeft.indexOf(payload.left_on)===-1) {
              columnsLeft.push(payload.left_on)
            }
            if (columnsRight.indexOf(payload.right_on)===-1) {
              columnsRight.push(payload.right_on)
            }

            var filterLeft = `.cols.select(["${columnsLeft.join('", "')}"])`
            // var filterLeft = ``
            var filterRight = `.cols.select(["${columnsRight.join('", "')}"])`
            // var filterRight = ``

            if (payload._requestType) {
              return async (from, to) => {
                var window = ''
                if (from!==undefined) {
                  window = `,${from},${to}`
                }
                if (!this.currentSecondaryDatasets[payload.with] || !this.currentSecondaryDatasets[payload.with].buffer) {
                  await this.evalCode('_output = '+payload.with+'.ext.set_buffer("*")') // TODO check changed
                  this.$store.commit('setSecondaryBuffer',{ key: payload.with, value: true})
                }
                return `${filterLeft}.cols.join(${payload.with}.ext.buffer_window("*"${window})${filterRight}`
                + `, left_on="${payload.left_on}"`
                + `, right_on="${payload.right_on}", how="${payload.how}")${filterEnd}`
              }
            } else {
              return `${filterLeft}.cols.join(${payload.with}${filterRight}`
                + `, left_on="${payload.left_on}"`
                + `, right_on="${payload.right_on}", how="${payload.how}")${filterEnd}`
            }

          },
          content: (payload) => `<b>Join</b> ${hlParam(this.dataset.varname)} <b>with</b> ${hlParam(payload.with)}`
        },
        aggregations: {
          dialog: {
            title: 'Get aggregations',
            fields: [
              {
                type: 'autocomplete',
                key: 'group_by',
                label: 'Group by',
                clearable: true,
                items_key: 'allColumns'
              },
              {
                type: 'text',
                text: 'Aggregations'
              },
              {
                type: 'repeat',
                key: 'aggregations',
                add: true,
                addOne: (c)=>{
                  this.currentCommand.input_cols.push(c.allColumns[0])
                  this.currentCommand.aggregations.push('count')
                  this.currentCommand.output_cols.push('')
                },
                removeOne: (c,i)=>{
                  c.input_cols.splice(i,1)
                  c.aggregations.splice(i,1)
                  c.output_cols.splice(i,1)
                  this.currentCommand = c
                },
                fields: [
                  {
                    type: 'select',
                    key: 'input_cols',
                    label: 'Column',
                    class: 'half-with-btn',
                    items_key: 'allColumns'
                  },
                  {
                    type: 'select',
                    class: 'half-with-btn',
                    key: 'aggregations',
                    label: 'Type',
                    items: [
                      { text: 'Count', value: 'count' },
                      { text: 'Sum', value: 'sum' },
                      { text: 'Mean', value: 'mean' },
                      { text: 'Std', value: 'std' },
                      { text: 'Min', value: 'min' },
                      { text: 'Max', value: 'max' },
                      { text: 'First', value: 'first' },
                      { text: 'Last', value: 'last' },
                    ]
                  },
                  // {
                  //   type: 'field',
                  //  // class: 'with-icon-btn',
                  //   label: 'Rename',
                  //   placeholder: (c,i)=>c.output_cols_default(c)[i],
                  //   key: 'output_cols'
                  // },
                ]
              }
            ],
            validate: (c)=>{
              if (c.group_by.length==0) {
                return 0
              }
              return (c.input_cols.length && c.aggregations.length)
            },
          },
          payload: (columns) => ({
            allColumns: this.allColumns,
            group_by: [],
            input_cols: columns,
            aggregations: columns.map(e=>'count'),
            output_cols_default: (c)=>c.aggregations.map((aggregation,i)=>`${aggregation}_${c.input_cols[i]}`),
            output_cols: columns.map(e=>''),
            previewType: 'aggregations',
            datasetPreview: true,
            noBufferWindow: true,
            _expectedColumns: ()=>{
              var payload = this.currentCommand
              var output_cols_default = payload.output_cols_default(payload)
              var aggregations = payload.aggregations.map((oname,i)=>`"${payload.output_cols[i] || output_cols_default[i]}": {"${payload.input_cols[i]}":"${payload.aggregations[i]}"}`)
              aggregations = [...new Set(aggregations)]
              return aggregations.length+payload.group_by.length
            },
          }),
          code: (payload) => {
            var output_cols_default = payload.output_cols_default(payload)
            // var code = payload._requestType ? this.dataset.varname : ''

            var aggregations = payload.aggregations.map((oname,i)=>`"${payload.output_cols[i] || output_cols_default[i]}": {"${payload.input_cols[i]}":"${payload.aggregations[i]}"}`)

            aggregations = [...new Set(aggregations)]

            var code = ''

            code += `.cols.groupby(by="${payload.group_by[0]}", agg={`
            code += aggregations.join(', ')
            code += `})`

            if (payload._requestType=='preview') {
              return (from, to)=>code+(from!==undefined ? `[${from}:${to}]` : '')
            }

            return code
          },
          content: (payload) => `<b>Group by</b> ${multipleContent([payload.group_by],'hl--cols')} <b>aggregate</b> ${multipleContent([payload.input_cols, payload.aggregations],['hl--cols', 'hl--param'],', ',' using ', false, false)}`
        },
        STRING: {
          dialog: {
            title: 'String operation',
            output_cols: true,
          },
          payload: (columns) => ({
            columns: columns,
            output_cols: columns.map(e=>''),
            previewType: 'STRING'
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
          },
          content: (payload) => {
            var str = {
              trim: 'Trim white space in',
              lower: 'Lowercase',
              upper: 'Uppercase',
              remove_accents: 'Remove accents in',
              remove_special_chars: 'Remove special chars in'
            }
            return `<b>${str[payload.command]}</b> ${multipleContent([payload.columns],'hl--cols')}`
          }
        },
        cast: {
          code: (payload) => {
            var _argument = (payload.columns.length==1) ? `"${payload.columns[0]}"` : `["${payload.columns.join('", "')}"]`
            return `.cols.profiler_dtype(`
            +_argument
            +`, "${payload.dtype}"`
            +')'
          },
          content: (payload) => `<b>Cast</b> ${multipleContent([payload.columns],'hl--cols')} to ${multipleContent([payload.dtype],'hl--param')}`
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
						previewType: 'fill_na'
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
          },
          content: (payload) => `<b>Fill empty cells</b> in ${multipleContent([payload.columns],'hl--cols')} with ${hlParam(payload.fill)}`
        },
        'load file': {
          dialog: {
            title: 'Load file',
            acceptLabel: 'Load',
            fields: [
              {
                key: '_fileInput',
                label: 'File upload',
                accept: 'text/csv, .csv, application/json, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, .xls, .xlsx, .avro, .parquet',
                type: 'file'
              },
              {
                condition: (c)=>(c._fileInput && c._fileInput.toString() && c._fileInput!==c._fileLoaded),
                type: 'action',
                label: 'Preview',
                loading: '_fileUploading',
                func: 'uploadFile'
              },
              {
                key: '_moreOptions',
                label: (c) => `More options: ${c._moreOptions ? 'Yes' : 'No'}`,
                type: 'switch'
              },
              {
                key: 'url',
                label: 'File url',
                placeholder: (c)=>{
                  var fileType = (c.file_type!='infer') ? c.file_type : (c._fileType)
                  return `https://example.com/my_file`
                  return `https://example.com/my_file.${fileType}`
                },
                type: 'field',
                condition: (c)=>c._moreOptions,
              },
              {
                condition: (c)=>c._moreOptions,
                key: 'limit',
                label: 'Limit',
                min: 1,
                clearable: true,
                type: 'number'
              },
              {
                key: 'file_type',
                label: 'File type',
                type: 'select',
                items: [
                  { text: 'Infer file type', value: 'file' },
                  { text: 'CSV', value: 'csv' },
                  { text: 'XLS', value: 'xls' },
                  { text: 'JSON', value: 'json' },
                  { text: 'Avro', value: 'avro' },
                  { text: 'Parquet', value: 'parquet' }
                ],
                condition: (c)=>c._moreOptions
              },
              {
                condition: (c)=>c.file_type==='csv' && c._moreOptions,
                key: 'header',
                label: (c) => `First row as Header: ${c.header ? 'Yes' : 'No'}`,
                type: 'switch'
              },
              {
                condition: (c)=>c.file_type==='csv' && c._moreOptions,
                key: 'null_value',
                label: 'Null value',
                type: 'field'
              },
              {
                condition: (c)=>c.file_type==='csv' && c._moreOptions,
                key: 'sep',
                label: 'Separator',
                type: 'field'
              },
              {
                condition: (c)=>c.file_type==='csv' && c._moreOptions,
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
                condition: (c)=>c.file_type==='json' && c._moreOptions,
                key: 'multiline',
                label: (c) => `Multiline: ${c.multiline ? 'Yes' : 'No'}`,
                type: 'switch'
              },
              {
                condition: (c)=>{
                  return (c.file_type==='xls' && c._moreOptions)
                  ||
                  ((!c._moreOptions || c.file_type==='file') && (c.url.endsWith('.xls') || c.url.endsWith('.xlsx')))
                },
                key: 'sheet_name',
                label: `Sheet`,
                items_key: '_sheet_names',
                type: (c)=> c._sheet_names.length ? 'select' : 'number'
              },
            ],
            validate: (c) => {
              if (c.url==='') {
                return 0
              }
              return !!(c.file_type!='csv' || c.sep)
            }

          },

          uploadFile: async () => {
            try {

              this.currentCommand._fileUploading = true

              var response = await this.$store.dispatch('request/uploadFile',{file: this.currentCommand._fileInput})

              if (response.fileType) {
                this.currentCommand.file_type = response.fileType
              }
              this.currentCommand.url = response.fileUrl
              this.currentCommand._fileUrl = response.fileUrl
              this.currentCommand._fileUploading = false
              this.currentCommand._datasetName = response.datasetName || false
              this.currentCommand._fileLoaded = this.currentCommand._fileInput
            } catch (error) {
              console.error(error)
              this.currentCommand.error = error
              this.currentCommand._fileUploading = false
            }
          },

          payload: () => ({
            command: 'load file',
            _fileUrl: '',
            _fileType: false,
            _fileUploading: false,
            _fileInput: [],
            _fileName: '',
            _moreOptions: false,
            file_type: 'csv',
            url: '',
            sep: ',',
            null_value: 'null',
            sheet_name: 0,
            header: true,
            limit: '',
            multiline: true,
            charset: 'UTF-8',
            _meta: false,
            _datasetName: false,
            _sheet_names: 1,
            previewType: 'load',
            loadPreview: true,
            isLoad: true,
            variableName: this.availableVariableName
            // _previewDelay: 500,
          }),

          code: (payload) => {
            let file = {
              header: (payload.header) ? `True` : `False`,
              multiline: (payload.multiline) ? `True` : `False`,
            }

            payload = escapeQuotesOn(payload,['sep','null_value','sheet_name','_datasetName','url'])

            var code = ''

            if (!payload._requestType) {
              code = `${payload.variableName} = `
            }

            var loadType = (!payload._moreOptions) ? 'file' : payload.file_type

            code +=`op.load.${loadType}("${payload.url.trim()}"`
            if (loadType=='csv') {
              code += `, sep="${payload.sep}"`
              code += `, error_bad_lines=False`
              code += `, header=${file.header}`
              code += `, null_value="${payload.null_value}"`
              code += `, infer_schema="true"`
              code += `, encoding="${payload.charset}"`
            }
            else if (loadType=='json') {
              code += `, multiline=${file.multiline}`
            }
            else if (loadType=='xls') {
              if (payload._sheet_names.length) {
                code += `, sheet_name="${payload.sheet_name}"`
              } else {
                code += `, sheet_name=${payload.sheet_name}`
              }
            }
            if (payload._requestType) {
              var limit = 35
              if (payload.limit>0 && payload.limit<limit) {
                limit = payload.limit
              }
              code +=`, n_rows=${limit}`
            } else if (payload.limit>0) {
              code +=`, n_rows=${payload.limit}`
            }
            if (loadType!='file') {
              code += `, quoting=0, lineterminator=None, cache=True`
            } else if (payload.url.endsWith('.xls') || payload.url.endsWith('.xlsx')) {
              if (payload._sheet_names.length) {
                code += `, sheet_name="${payload.sheet_name}"`
              } else {
                code += `, sheet_name=${payload.sheet_name}`
              }
            }
            code += `).ext.cache()`

            return code
          },

          content: (payload) => {
            var infer = (payload.file_type==='file' || !payload._moreOptions)
            var fileType = (infer) ? payload._fileType : payload.file_type
            var fileName = payload._fileName
            return `<b>Load</b>`
            + ( fileName ? ` ${hlParam(fileName)}` : '')
            + ( (!fileName && fileType) ? ` ${fileType}` : '')
            + ' file'
            + ' to '+hlParam(payload.variableName)
          }
        },
        'string clustering': {
          dialog: {
            dialog: true,
            tall: true,
            title: 'String clustering',
            acceptLabel: 'Merge',
            fields: [
              {
                type: 'select',
                key: 'algorithm',
                label: 'Algorithm',
                items: [
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
                type: 'action',
                label: 'Get clusters',
                func: 'getClusters',
                validate: (c)=>( c.algorithm!=c.valid.algorithm || (c.n_size!=c.valid.n_size && c.algorithm=='n_gram_fingerprint') )
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

              if (this.currentCommand.algorithm == 'fingerprint')
                code = `from optimus.engines.dask.ml import keycollision as kc; _output = kc.fingerprint_cluster(${this.dataset.varname}.ext.buffer_window("*"), input_cols="${this.currentCommand.columns[0]}", output="json")`
              else if (this.currentCommand.algorithm == 'n_gram_fingerprint')
                code = `from optimus.engines.dask.ml import keycollision as kc; _output = kc.n_gram_fingerprint_cluster(${this.dataset.varname}.ext.buffer_window("*"), input_cols="${this.currentCommand.columns[0]}", n_size=${this.currentCommand.n_size}, output="json")`
              else
                throw 'Invalid algorithm type input'

              this.currentCommand.loading = true
              this.currentCommand.clusters = false
              this.currentCommand.error = false

              var response = await this.evalCode(code)

              if (!response || !response.data || !response.data.result) {
                throw response
              }

              var clusters = parseResponse(response.data.result)

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

              var _error = printError(error)
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
              algorithm: 'fingerprint',
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
            .join('')
          },
          content: (payload) => { // TODO: Test
            return `<b>Clusterize</b> ${multipleContent([payload.clusters.map(e=>e.replace)], 'hl--param')} in ${hlCols(payload.columns[0])}`
          }
        },
        outliers: {
          dialog: {
            dialog: true,
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

              var outliers_data = parseResponse(response.data.result)

              if (!outliers_data) {
                throw response
              }

              if ( ['tukey','mad'].includes(this.currentCommand.algorithm) ) {

                var hist_response = await this.evalCode(`_output = outlier.hist("${this.currentCommand.columns[0]}")`)
                var hist_data = parseResponse(hist_response.data.result)

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

              var _error = printError(error)
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
              return `${payload.code_done}${'\n'}outlier.${payload.action=='Drop' ? 'drop' : 'select'}()`
            }
            else {

              // TODO various ranges
              return payload.selection.map(selection=>`.rows.between(`
              +`"${payload.columns[0]}"`
              +`, lower_bound=${selection[0]}`
              +`, upper_bound=${selection[1]}`
              +`, invert=${payload.action=='Drop' ? 'True' : 'False'}`
              +')'
              ).join('')
            }
          },
          content: (payload) => { // TODO: Test
            return `<b>${payload.action} outliers</b> (between ${multipleContent(payload.selection[0],'hl--param',', ',' and ')})`
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
              {
                type: 'action',
                label: 'Get tables',
                loading: '_loadingTables',
                func: 'getTables'
              }
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
            driver: 'mysql',
            host: '',
						database: '',
						user: '',
            password: '',
            _loadingTables: false,
            isLoad: true,
            variableName: this.availableVariableName
          }),
          code: (payload) => {
            var table = escapeQuotes(payload.table)
            return `${payload.previous_code}${'\n'}${payload.variableName} = db.table_to_df("${table}").ext.cache()`
          },
          content: (payload)=>{
            var database = ['postgres','presto','redshift','sqlserver','mysql'].includes(payload.driver)
            return `<b>Load</b> ${hlParam(payload.table)}`
            +(database ? ` from ${hlParam(payload.database)}` : '')
            + ' to '+hlParam(payload.variableName)
          },
          getTables: async (payload) => {

            this.currentCommand._loadingTables = true
            this.currentCommand.error = ''

            var fields = this.commandsHandlers['load from database'].dialog.fields

            try {
              var driver = escapeQuotes(payload.driver)
              var code = `db = op.connect(driver="${driver}"`

              fields.forEach(field => {
                if (!['driver','oracle_type', 'table', undefined].includes(field.key)) {
                  code += (
                    (!field.condition || field.condition(this.currentCommand) && payload[field.key] && field.key) ?
                    `, ${field.key}="${escapeQuotes(payload[field.key])}"` : ''
                  )
                }
              });

              code += ')'

              var response = await this.evalCode(code+`; _output = db.tables_names_to_json()`)

              var tables = response.data.result

              // var tables = parseResponse(response.content)
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
              this.currentCommand._loadingTables = false
            } catch (error) {

              printError(error)

              var _error = printError(error)
              this.currentCommand = {...payload, error: _error}
              this.currentCommand._loadingTables = false
            }
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
          },
          noAdd: true // TODO
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
          },
          content: (payload) => { // TODO: Test
            return`<b>Stratified sampling</b> on ${multipleContent([payload.columns],'hl--cols')}`
            + (payload.seed!=='' ? ` using ${hlParam(payload.seed)}` : '')
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
                type: 'switch',
                key: 'match_case',
                label: (c)=>'Match case: ' + (c.match_case ? 'Yes' : 'No')
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
            validate: (command) => {
              if (!command.search.length) {
                return 0
              }
              return (command.output_cols.filter(e=>e!=='').length%command.columns.length===0)
            }
          },
          payload: (columns) => ({
						command: 'replace',
						columns: columns,
            search: [],
            replace: '',
						search_by: 'chars',
            output_cols: columns.map(e=>e),
            match_case: false,
            title: 'Replace in ' + (columns.length==1 ? `column` : 'columns'),
            previewType: 'replace',
            highlightColor: {default: 'red', preview: 'green'}
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
              +`, ignore_case=${!payload.match_case ? 'True' : 'False'}`
              +( (output_cols_argument) ? `, output_cols=${output_cols_argument}` : '')
              +')'
              +( (payload._requestType==='preview') ? `.cols.find(${_argument}, sub=["${search.join('","')}"], ignore_case=${!payload.match_case ? 'True' : 'False'})` : '')
              +( (payload._requestType==='preview' && payload.replace) ? `.cols.find(${output_cols_argument}, sub=["${payload.replace}"])` : '')
          },
          content: (payload)=>`<b>Replace</b> ${multipleContent([payload.search],'hl--param')} with ${hlParam(payload.replace)} in ${multipleContent([payload.columns],'hl--cols')}`
        },
        set: {
          dialog: {
            fields: [
              {
                type: 'field',
                key: 'value',
                label: 'Expression or value',
                mono: true
              },
              // {
              //   type: 'field',
              //   key: 'where',
              //   label: 'Where',
              //   placeholder: 'column!=None'
              // },
              {
                type: 'field',
                key: 'output_col',
                label: 'Output column',
                condition: (c)=>!c.columns.length
              },
            ],
            output_cols: true,
            validate: (command) => {
              var output_col = command.output_cols[0] || command.output_col || command.columns[0]
              return (
                (command.columns[0] || command.value)
                &&
                (command.columns[0] || output_col)
                &&
                (command.value || output_col || command.where)
              )
            }
          },
          payload: (columns) => ({
            allColumns: this.allColumns,
            command: 'set',
            columns,
            value: (columns[0] ? `${columns[0]}` : ''),
            where: (columns[0] ? `${columns[0]}!=None` : ''),
            title: (columns[0] ? `Set column` : 'Create column'),
            _expectedColumns: 1,
            previewType: 'set',
            output_col: 'new_column',
            output_cols: columns.map(e=>'')
          }),
          code: (payload) => {

            if (!payload.output_cols.length) {
               payload.output_cols = [payload.output_col]
            }
            var output_cols_argument = getOutputColsArgument(payload.output_cols, payload.columns, (payload._requestType) ? 'new ' : '')

            // var varname = this.dataset.varname

            var cb = (from, to) => {
              var window = ''
              if (from!==undefined) {
                window = `,${from},${to}`
              }
              // if (payload._requestType) {
              //   varname += `.ext.buffer_window("*"${window})`
              // }

              var value = payload.value // payload.value ? parseExpression(payload.value, 'df', payload.allColumns) : ''
              // var where = payload.where ? parseExpression(payload.where, 'df', payload.allColumns) : ''

              if (payload.columns[0] && !value) {
                // where = `~(${where})`
                value = 'None'
              }

              return `.cols.set(`
              + `default="${payload.columns[0]}", `
              + 'value=' + ( (value) ? `'${value}'` : "'None'" )
              // + ', where=' + ( (where) ? `'${where}'` : 'None' )
              + ', output_cols=' + output_cols_argument
              + `)`
            }

            if (payload._requestType) {
              return cb
            } else {
              return cb()
            }

          },
          content: (payload) => {

            var output_cols = payload.output_cols

            if (!payload.output_cols.length || (payload.output_cols.length===1 && !payload.output_cols[0])) {
               output_cols = [payload.output_col || payload.columns[0]]
            }

            var action = 'Create'

            var er = everyRatio(output_cols, (col)=>payload.allColumns.indexOf(col)>=0)

            if (er===1) {
              action = 'Set'
            } else if (er>0) {
              action = 'Set / Create'
            }

            return `<b>${action}</b> ${multipleContent([output_cols],'hl--cols')} with ${multipleContent([payload.value],'hl--param')}`
              + (payload.where ? ` where ${multipleContent([payload.where],'hl--param')}` : '')
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
          },
          content: (payload)=>`<b>Rename</b> ${multipleContent([payload.columns, payload.output_cols], 'hl--cols', ', ', ' to ', false, false)}`
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
              previewType: 'unnest',
              _expectedColumns: () => this.currentCommand.splits,
              highlightColor: 'red'
            }
					},
					code: (payload) => {
            var _argument = (payload.columns.length==1) ? `"${payload.columns[0]}"` : `["${payload.columns.join('", "')}"]`
            var output_cols_argument = getOutputColsArgument(payload.output_cols, payload.columns, (payload._requestType) ? 'new ' : '')
						payload = escapeQuotesOn(payload, ['separator'])

            var code = `.cols.unnest(`
              +_argument
              +( (payload.separator) ? `, separator="${payload.separator}"` : '')
              +( (payload.splits) ? `, splits=${payload.splits}` : '')
              +( (payload.index) ? `, index=${payload.index}` : '')
              +( (output_cols_argument) ? `, output_cols=${output_cols_argument}` : '')
              +( (payload._requestType==='profile' || payload.drop) ? ', drop=True' : '')
							+')'

						if (payload._requestType==='preview') {
							code += `.cols.find(${_argument}, sub=["${payload.separator}"])`
						}
						return code
          },
          content: (payload) => `<b>Split</b> ${hlCols(payload.columns[0])} by ${hlParam(payload.separator)} in ${hlParam(payload.splits)}`

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
                key: 'output_col',
                label: 'Output column name',
                placeholder: (c) => c.columns.join('_'),
                clearable: true,
              },
            ]
          },
          payload: (columns) => {
            return {
              command: 'nest',
              columns,
              separator: ', ',
              title: 'Nest '+(columns.length==1 ? `column` : 'columns'),
              defaultOutputName: columns.join('_'),
              output_col: columns.join('_'),
              previewType: 'nest',
              _expectedColumns: 1,
              highlightColor: 'green'
					}
          },
					code: (payload) => {
            var output_col = payload.output_col
            if (!output_col || payload._requestType) {
              output_col = payload.defaultOutputName
            }
            payload = escapeQuotesOn(payload,['separator','output_col'])
            return `.cols.nest(["${payload.columns.join('", "')}"]`
						+( (payload.separator) ? `, separator="${payload.separator}"` : '')
            +`, output_col="${output_col}")`
            +( (payload._requestType==='preview' && payload.separator) ? `.cols.find("${output_col}", sub=["${payload.separator}"])` : '')
          },
          content: (payload) => `<b>Merge</b> ${multipleContent([payload.columns],'hl--cols')} in ${hlCols(payload.output_col)}`
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
          },
          content: (payload)=>`<b>Duplicate</b> ${multipleContent([payload.columns, payload.output_cols],'hl--cols')}`
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
          content: (payload) => { // TODO: Test
            return `<b>Bucketize</b> `
            + columnsHint(payload.columns,payload.output_cols)
            + (payload.splits ? `by ${hlParam(payload.splits)}` : '')
          }

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
          },
          content: (payload) => { // TODO: Test
            return `<b>Set values to columns</b> using ${hlCols(payload.columns[0])}`
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
          content: (payload) => { // TODO: Test
            return `<b>Set strings to indices</b> on`
            + columnsHint(payload.columns,payload.output_cols)
          }
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
          content: (payload) => { // TODO: Test
            return `<b>Set indices to strings</b> `
            + columnsHint(payload.columns,payload.output_cols)
          }
        },
        ML: { // TODO: Test
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
          content: (payload) => { // TODO: Test
            var scaler = 'scaler'
            if (command.command=='z_score')
              scaler = 'standard scaler'
            if (command.command== 'min_max_scaler')
              scaler = 'min max scaler'
            if (command.command== 'max_abs_scaler')
              scaler = 'max abs scaler'
            return `<b>Apply ${scaler}</b> to`
            + columnsHint(payload.columns,payload.output_cols)
            + (payload.splits ? `by ${hlParam(payload.splits)}` : '')
          }
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
          content: (payload) => { // TODO: Test
            return `<b>Impute rows</b> on`
            + columnsHint(payload.columns,payload.output_cols)
            + (payload.strategy ? `using ${hlParam(payload.strategy)}` : '')
          }
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
          content: (payload) => { // TODO: Test
            return `<b>Sample</b> to ${hlParam(payload.n)} rows`
          }
        },
      }
    }
  },

  computed: {

    ...mapGetters([
      'currentSelection',
      'currentCells',
      'selectionType',
      'currentTab',
      'currentDuplicatedColumns',
      'currentPreviewNames',
      'currentPreviewInfo',
      'currentSecondaryDatasets',
      'currentLoadPreview'
    ]),

    cells: {
      get() {
        return Array.from(this.currentCells || [])
      },
      set(value) {
        this.$store.commit('setCells', value)
      }
    },

    command () {
      try {
        return this.commandsHandlers[this.currentCommand.command] || this.commandsHandlers[this.currentCommand.type]
      } catch (error) {
        console.error(error)
        return undefined
      }
      // command.dialog && (currentCommand.command == key || currentCommand.type == key)
    },

    allColumns () {
      return this.dataset.columns.map(e=>e.name)
    },

    availableVariableName () {

      var name = 'df'

      if (this.currentTab) {
        var name = name+this.currentTab
      }

      if (!this.dataset || this.dataset.blank) {
        return name
      }

      var sd = Object.keys(this.currentSecondaryDatasets)
        .filter(e=>e.startsWith(name+'_'))
        .filter(e=>!e.startsWith('_'))

      name = name+'_'+sd.length

      // this.$store.commit('setSecondaryDataset',{ name })
      this.$store.commit('setHasSecondaryDatasets', true )

      return name
    },

    dragOptions () {
      return {
        animation: 200,
        group: "description",
        disabled: this.commandsDisabled,
        ghostClass: "ghost"
      }
    },

    previewError () {
      try {
        return this.currentPreviewInfo.error
      } catch (err) {
        return false
      }
    },

    computedCommandsDisabled: {
      get () {
        return this.commandsDisabled
      },
      set (val) {
        this.$emit('update:commandsDisabled',val)
      }
    }

  },

  mounted () {
    this.seeCode = this.$route.query.code=='1'
  },

  watch: {

    codeError (value) {
      if (value && value.length) {
        this.$store.commit('clearDatasetProperties')
      }
    },

    currentSelection: {
      deep: true,
      handler (selection) {

        try {

          if (!selection || !selection.ranged || selection.ranged.index<0 || !this.dataset.columns[selection.ranged.index]){
            return
          }

          var command = { command: 'REMOVE_KEEP_SET' }

          command.columns = [ this.dataset.columns[selection.ranged.index].name ]

          command.payload = { rowsType: this.selectionType }

          if (this.selectionType=='ranges') {
            command.payload.selection = selection.ranged.ranges
          } else if (this.selectionType=='values') {
            command.payload.selection = selection.ranged.values
          } else {
            return
          }

          this.commandHandle( command )

        } catch (err) {
          console.error(err)
        }
      },
    },

    currentLoadPreview ({meta}) {
      var c = { ...this.currentCommand }

      try {
        if (c.command==='load file' && meta) {
          if (meta.sheet_names!==undefined) {
            c._sheet_names = meta.sheet_names
            if (meta.sheet_names.length && !meta.sheet_names.includes(c.sheet_name)) {
              c.sheet_name = meta.sheet_names[0]
            }
          }
          if (meta.file_name) {
            c._fileName = meta.file_name
          } else {
            // c._fileName = 'test.csv'
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
          var command = this.commandsHandlers[this.currentCommand.command] || this.commandsHandlers[this.currentCommand.type]
          if (command && command.dialog) {
            var valid = (!command.dialog.validate) ? true : command.dialog.validate(this.currentCommand)
            if (valid===0) {
              this.restorePreview(true)
              return
            }
            if (this.currentCommand.previewType) {

              if (this.currentCommand.output_cols || this.currentCommand.defaultOutputName) {

                // column name optimization
                var nameMap = {}

                if (this.currentCommand.columns && this.currentCommand.output_cols) {
                  this.currentCommand.output_cols.forEach((col, i) => {
                    nameMap[ 'new '+this.currentCommand.columns[i] ] = col
                  })
                }

                if (this.currentCommand.output_col && this.currentCommand.defaultOutputName) {
                  nameMap[this.currentCommand.defaultOutputName] = this.currentCommand.output_col
                }

                this.$store.commit('setPreviewNames',nameMap)
                var newColumns = 0
                for (const key in nameMap) {
                  if (nameMap[key] && 'new '+nameMap[key]!==key) {
                    newColumns++
                  }
                }
                if (this.currentCommand.defaultOutputName && !newColumns) {
                  newColumns = 1
                }
                this.$store.commit('setPreviewInfo', {newColumns})
              }


              this.preparePreviewCode()
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

    dataset: {
      deep: true,
      handler () {
        if (this.computedCommandsDisabled===undefined) {
          this.computedCommandsDisabled = false
          this.markCells()
          this.$emit('update:codeError','')
          this.lastWrongCode = false
        }
      }
    },

  },

  methods: {

    forceFileDownload(url, filename){
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename) //or any other extension
      link.download = filename
      document.body.appendChild(link)
      link.click()

    },

    async downloadDataset () {
      try {
        this.cancelCommand()
        await this.runCodeNow()
        var url = `downloads/${this.$store.state.session}`
        await this.evalCode(`_output = ${this.dataset.varname}.save.csv("/opt/Bumblebee/packages/api/public/${url}")`)
        this.forceFileDownload(process.env.API_URL+'/'+url+'/0.part',this.dataset.name+'.csv')
      } catch (error) {
        console.error(error)
      }
    },

    async bufferDf () {
      // this.$store.dispatch('bufferDf')
      try {
        await this.evalCode('_output = '+this.dataset.varname+'.ext.set_buffer("*")')
        this.$store.commit('setBuffer',true)
      } catch (error) {
        console.error(error)
      }
    },

    restorePreview (restoreColumns) {
      if (restoreColumns) {
        this.$store.commit('previewDefault')
        return
      }
      if (this.currentPreviewCode) {
        this.$store.commit('setPreviewCode', undefined)
      }
      // if (this.currentPreviewNames) {
      //   this.$store.commit('setPreviewNames', undefined)
      // }
      // if (this.currentDuplicatedColumns) {
      //   this.$store.commit('setDuplicatedColumns', undefined)
      // }
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

    cleanCodeError () {
      this.$emit('update:codeError','')
    },

    moveBarDelayed: debounce(async function(value) {
      this.moveBar(value)
    },300),

    preparePreviewCode: debounce( async function() {

      try {

        var expectedColumns

        // if (this.currentCommand.datasetPreview) {
        //   expectedColumns = -1
        // } else
        if (this.currentCommand._expectedColumns!==undefined) {
          expectedColumns = getProperty(this.currentCommand._expectedColumns, [this.currentCommand])
        } else if (this.currentCommand.output_cols && this.currentCommand.output_cols.length) {
          expectedColumns = this.currentCommand.output_cols.length
        } else if (this.currentCommand.columns) {
          expectedColumns = this.currentCommand.columns.length
        }

        var joinPreview = getProperty(this.currentCommand.joinPreview, [this.currentCommand])
        var color = getProperty(this.currentCommand.highlightColor, [this.currentCommand])

        this.$store.commit('setPreviewCode',{
          code: this.getCode(this.currentCommand,'preview'),
          profileCode: this.getCode(this.currentCommand,'profile'),
          color,
          from: this.currentCommand.columns,
          datasetPreview: !!this.currentCommand.datasetPreview,
          loadPreview: !!this.currentCommand.loadPreview,
          load: this.currentCommand.previewType==='load',
          infer: this.currentCommand._moreOptions===false,
          noBufferWindow: getProperty(this.currentCommand.noBufferWindow,[this.currentCommand]),
          expectedColumns,
          joinPreview
        })

        // TODO: Generalize

      } catch (err) {
        console.error(err) // probably just a cancelled request
      }


    }, 10),

    getCommandTitle() {
      try {
        if (this.command.dialog.title) {
          return getProperty(this.command.dialog.title,[this.currentCommand])
        }
        return this.currentCommand.title
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

    codeText (newOnly = false, ignoreFrom = -1) {
      if (newOnly)
        return (this.cells.length) ? (this.cells.filter((e,i)=>((ignoreFrom<0 || i<ignoreFrom) && e.code!=='' && !e.done && !e.ignore)).map(e=>e.code).join('\n').trim()) : ''
      else
        return (this.cells.length) ? (this.cells.filter((e,i)=>((ignoreFrom<0 || i<ignoreFrom) && e.code!=='' && !e.ignore)).map(e=>e.code).join('\n').trim()) : ''
    },

    async commandHandle (command) {

      if (this.selectionType!=='text') {
        this.clearTextSelection()
      }

      this.$store.commit('setPreviewColumns',false) // TODO: Check

			var payload = {}
      var columns = undefined
      var columnDataTypes = undefined

      if (!command.columns || !command.columns.length) {
        columns = this.columns.map(e=>this.dataset.columns[e.index].name)
        columnDataTypes = this.columns.map(e=>this.dataset.columns[e.index].profiler_dtype)
      }
      else {
        columns = command.columns
        var columnIndices = namesToIndices(columns, this.dataset.columns)
        columnDataTypes = columnIndices.map(i=>this.dataset.columns[i].profiler_dtype)
      }

      var commandHandler = this.commandsHandlers[command.command] || this.commandsHandlers[command.type]

      payload.type = command.type
      payload.command = command.command
      payload._noOperations = command.noOperations

      payload.columnDataTypes = columnDataTypes

      if (commandHandler) {

        payload = (commandHandler.payload) ? ( {...await commandHandler.payload(columns, payload), ...payload} ) : payload

        if (commandHandler.dialog) {

          this.currentCommand = {...payload, ...(command.payload || {})}

          this.$emit('updateOperations', { active: true, title: this.getCommandTitle() })
          this.$emit('update:big',commandHandler.dialog.big) // :max-width="command.dialog.big ? 820 : 410"

          if (commandHandler.onInit) {
            await commandHandler.onInit()
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
            columns: payload.columns || columns,
            payload
          }
          var content = this.getOperationContent(cell)
          this.addCell(-1, {...command, code: this.getCode(cell,false), content})
          this.runButton = false

          this.clearTextSelection()
        }
      }
    },

    async confirmCommand () {
      this.clearTextSelection()
      var commandHandler = this.commandsHandlers[this.currentCommand.command] || this.commandsHandlers[this.currentCommand.type]
      if (commandHandler.onDone) {
        this.currentCommand = await commandHandler.onDone(this.currentCommand)
      }
      var code = this.getCode(this.currentCommand, false)
      var content = this.getOperationContent(this.currentCommand)

      var toCell = this.currentCommand._toCell!==undefined ? this.currentCommand._toCell : -1

      this.addCell(toCell, { ...this.currentCommand, code, content }, true )
      this.runButton = false

      this.$emit('updateOperations', { active: (this.currentCommand._noOperations ? false : true), title: 'operations' } )
      this.$emit('update:big', this.seeCode)

      this.currentCommand = false
      // this.$store.commit('previewDefault')
    },

    cancelCommand () {
      // TODO: Check
			setTimeout(() => {
        // this.recoverTextSelection()
        this.clearTextSelection()
        this.currentCommand = false
        this.$emit('updateOperations', {
          active: false,
          title: 'operations'
        })
        this.$store.commit('previewDefault')
        this.runCodeNow()
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
        this.activeCell = 0
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

    removeCell (index) {

      this.runButton = false

      var permanentCells = ['load file', 'load from database']

      if (index<0 || !this.cells[index]) {
        return
      }

      if (permanentCells.includes(this.cells[index].command) && this.cells.filter(e => permanentCells.includes(e.command) ).length<=1) {
        if (this.cells.length>1) {
          return
        }
      }

      this.$emit('update:codeError','')

      var cells = [...this.cells]
      cells.splice(index,1)
      this.cells = cells
      if (this.cells.length==index) {
        index--
      }

      this.setActiveCell(index, true)

      if (this.cells.length==0)
        this.$store.commit('newDataset', true)
        this.codeDone = ''

      this.draggableEnd()
    },

    markCells(mark = true, ignoreFrom = -1) {
      var cells = [...this.cells]
      for (let i = 0; i < this.cells.length; i++) {
        if (ignoreFrom>=0 && i>=ignoreFrom) {
          continue
        }
        if (cells[i].code) {
          cells[i].done = mark
        }
        cells[i].error = false
      }
      this.cells = cells

      if (mark && this.cells)
        this.codeDone = this.codeText(false, ignoreFrom)
      else
        this.codeDone = ''
    },

    markCellsError(ignoreFrom = -1) {
      var cells = [...this.cells]
      for (let i = cells.length - 1; i >= 0; i--) {
        if (ignoreFrom>=0 && i>=ignoreFrom) {
          continue
        }
        if (!cells[i].done && cells[i].code) {
          cells.splice(i,1)
        }
      }
      this.cells = cells

      if (this.cells)
        this.codeDone = this.codeText(false, ignoreFrom)
      else
        this.codeDone = ''
    },

    getOperationContent (payload) {
      var commandHandler = this.commandsHandlers[payload.command] || this.commandsHandlers[payload.type]

      if (!commandHandler || !commandHandler.content) {
        return this.getCode(payload, false)
      }

      return commandHandler.content(payload)
    },

    getCode (currentCommand, type) {

      var payload = {...currentCommand}

      var code = ''

      if (!payload.columns || !payload.columns.length) {
        payload.columns = this.columns.map(e=>this.dataset.columns[e.index].name)
      }

      // if (type==='preview' || type==='profile') {
      //   if (payload.columns) {
      //     payload.output_cols = payload.columns.map(e=>'__preview__'+e)
      //   }
      // }

      var precode = ''

      if (!payload._code) {
        var commandHandler = this.commandsHandlers[payload.command] || this.commandsHandlers[payload.type]
        if (commandHandler) {
          code = commandHandler.code ? commandHandler.code({...payload, _requestType: type}) : ''
        }
      }
      else {
        code = payload._code
      }

      if (type==='preview') {
        return code
      } else if (type==='profile') {
        return code
      } else {
        // if (typeof code === 'object') {
        //   precode = code.precode + '\n'
        //   code = code.code
        // }
        if (payload.isLoad) {
          return precode + code +'\n'
					// +`${this.dataset.varname} = ${this.dataset.varname}.ext.optimize()`+'\n'
					+`${this.dataset.varname} = ${this.dataset.varname}.ext.repartition(8).ext.cache()`
        } else {
          return precode + `${this.dataset.varname} = ${this.dataset.varname}${code}.ext.cache()`
        }
      }



    },

    async editCell (cell, index) {
      // console.log('[DEBUG] Editing ',{cell, index})
      var commandHandler = this.commandsHandlers[cell.command] || this.commandsHandlers[cell.type]
      if (commandHandler.dialog) {
        this.computedCommandsDisabled = true;
        await this.runCodeNow(true, index)
        this.computedCommandsDisabled = false;
        cell.payload._toCell = index
        this.commandHandle(cell)
      }
    },

    addCell (at = -1, payload = {command: 'code', code: '', content: '', ignoreCell: false, noCall: false, deleteOtherCells: false}, replace = false) {

      var {command, code, ignoreCell, deleteOtherCells, content} = payload

      this.$emit('update:codeError','')

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

      cells.splice(at, +replace, {
        payload: payload,
        type: payload.type,
        command,
        code: code,
        content: content,
        id: Number(new Date()),
        active: false,
        ignore: ignoreCell
      })

      this.cells = cells

      if (!payload.noCall) {
        this.$nextTick(()=>{
          if (this.activeCell<0) {
            this.setActiveCell(0)
          }
          if (code.length) {
            this.runCode()
          }
        })
      }

    },



    async runCodeNow (force = false, ignoreFrom = -1) {

      if (ignoreFrom>=0) {
        force = true
      }

      var code = this.codeText(false, ignoreFrom)
      var codeDone = this.codeDone.trim()
      var rerun = false

      if (code==='') {
        // console.log('[CODE MANAGER] nothing to run')
        return
      }

      if (code === codeDone) {
        // console.log('[CODE MANAGER] nothing new to run')
        return;
      }
      else if (
        ( !this.firstRun && (force || code.indexOf(codeDone)!=0 || codeDone=='' || this.lastWrongCode) )
        ||
        !this.socketAvailable
      ) {
        // console.log('[CODE MANAGER] every cell', {force, firstRun: this.firstRun, code, codeDone, lastWrongCode: this.lastWrongCode, socketAvailable: this.socketAvailable})
        rerun = true
      }
      else {
        // console.log('[CODE MANAGER] new cells only')
        code = this.codeText(true, ignoreFrom) // new cells only
      }

      if (code===this.lastWrongCode) {
        // console.log('[CODE MANAGER] code went wrong last time')
        return;
      }

      if (rerun) {
        // console.log('[CODE MANAGER] every cell is new')
        this.markCells(false, ignoreFrom)
      }

			if (this.firstRun) {
				this.firstRun = false
        rerun = false
			}

      this.computedCommandsDisabled = true;

      try {

        this.$store.commit('setBuffer',false)
        var response = await this.socketPost('cells', {
          code,
          name: this.dataset.summary ? this.dataset.name : null,
          varname: this.dataset.varname,
          session: this.$store.state.session,
          key: this.$store.state.key
        }, {
          timeout: 0
        })
        console.log('"""[DEBUG][CODE]"""',response.code)

        this.computedCommandsDisabled = false;

        if (!response.data || !response.data.result) {
          throw response
        }

        window.pushCode({code: response.code})

        var dataset = JSON.parse(response.data.result)

        this.$store.commit('loadDataset', {
          dataset
        })

        this.bufferDf()

        this.updateSecondaryDatasets()

        this.$forceUpdate()
        this.markCells(true, ignoreFrom)

        this.$emit('update:codeError','')
        this.lastWrongCode = false



      } catch (error) {
        if (error.code) {
          window.pushCode({code: error.code, error: true})
        }
        var codeError = printError(error)
        this.$emit('update:codeError',codeError)

        this.markCellsError(ignoreFrom)
        this.lastWrongCode = code
        this.computedCommandsDisabled = undefined;
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
