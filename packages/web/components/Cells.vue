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
            <OutputColumnInputs v-if="command.dialog.output_cols" :fieldLabel="command.dialog.output_cols_label" :noLabel="!command.dialog.output_labels" :currentCommand.sync="currentCommand"></OutputColumnInputs>
            <template>
              <v-alert key="error" type="error" class="mt-0" dismissible v-if="currentCommand.error"  @input="currentCommand.error=''">
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
                v-model="currentCommand.preview.filteredPreview"
                :label="`Filter results: ${currentCommand.preview.filteredPreview ? 'Yes' : 'No'}`"
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
              :disabled="(command.dialog.validate && !command.dialog.validate(currentCommand)) || (previewError && !allowError)"
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
            <v-tooltip transition="fade-transition" left content-class="bar-tooltip" color="primary">
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
import { getGenerator } from 'optimus-code-api'

import {

  deepCopy,
  everyRatio,
  arrayJoin,
  capitalizeString,
  printError,
  parseResponse,
  escapeQuotes,
  debounce,
  newName,
  getProperty,
  filterCells,
  multipleContent,
  hlParam,
  hlCols,
  namesToIndices,
  transformDateFromPython,

  TIME_NAMES,
  TYPES,
  STRING_TYPES
} from 'bumblebee-utils'

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

      cellsPromise: false,

      commandsHandlers: {
        'apply sort': {
          content: (payload) => {
            return `<b>Reorder</b> columns`
          }
        },
        DROP_KEEP: {
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

          payload: (columns, payload = {}) => ({
            columns,
            orders: columns.map(e=>'asc'),
          }),

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
                type: 'field-suggestions',
                key: 'value',
                placeholder: 'Expression or "value"',
                label: 'Expression',
                mono: true,
                useFunctions: true,
                fuzzySearch: true,
                suggestions: (c) => ({ 'column': c.allColumns })
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

              preview: {
                expectedColumns: (c) => +(c.action==='set'),
                type: 'REMOVE_KEEP_SET',
                filteredPreview: false,
                highlightColor: (c)=>c.action==='drop' ? 'red' : 'green',
                noBufferWindow: (c)=>c.preview.filteredPreview,
              },

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
                  { text: 'Less than or equal to', value: 'less', disabled: c.request.isString },
                  { text: 'Greater than or equal to', value: 'greater', disabled: c.request.isString  },
                  { text: 'Is Between', value: 'between', disabled: c.request.isString  },
                  { divider: true },
                  { text: 'Contains', value: 'contains' },
                  { text: 'Starts with', value: 'startswith' },
                  { text: 'Ends with', value: 'endswith' },
                  { divider: true },
                  { text: 'Custom expression', value: 'custom' },
                  { text: 'Pattern', value: 'pattern' },
                  { text: 'Selected', value: 'selected', disabled: true },
                  { divider: true },
                  { text: 'Mismatches values', value: 'mismatch' },
                  { text: 'Null values', value: 'null' }
                ]
              },
              {
                condition: (c)=>['exactly','not','less','greater'].includes(c.condition),
                key: 'value',
                placeholder: (c)=>(c.request.isString || true) ? 'Value' : 'numeric or "string"',
                label: 'Value',
                type: 'field'
              },
              {
                condition: (c)=>(c.condition === 'pattern'),
                key: 'value',
                placeholder: '',
                label: 'Pattern',
                type: 'field',
                mono: true
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

              switch (c.condition) {
                case 'oneof':
                  return (c.values.length)
                case 'exactly':
                case 'not':
                case 'less':
                case 'greater':
                case 'pattern':
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
              columns,
              condition,
              action: 'select',
              value: '',
              value_2: '',
              values: [],
              text: '',
              expression: columns[0].includes(' ') ? `{${columns[0]}}` : columns[0],

              request: {},

              preview: {
                filteredPreview: false,
                noBufferWindow: (c)=>c.preview.filteredPreview,
                highlightColor: (c)=>c.action==='drop' ? 'red' : 'green',
                expectedColumns: 0,
                type: 'filter rows'
              },
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
              case 'pattern':
                condition = 'with pattern '
                value = [payload.value]
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
          payload: (columns, payload = {}) => ({
            subset: columns,
            how: 'all',
            preview: {
              filteredPreview: false,
              type: 'drop empty rows',
              highlightColor: 'red',
              noBufferWindow: (c)=>c.preview.filteredPreview
            },
            request: {}
          }),
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
          payload: (columns, payload = {}) => ({
            subset: columns,
            keep: 'first',
            preview: {
              type: 'drop duplicates',
              highlightColor: 'red',
              filteredPreview: false,
              noBufferWindow: (c)=>c.preview.filteredPreview
            },
            request: {}
          }),
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
                onChange: (event, currentCommand)=>{
                  for (let i = currentCommand.selected_columns.length-1; i >= 0; i--) {
                    if (currentCommand.selected_columns[i].source==='right') {
                      currentCommand.selected_columns.splice(i,1)
                    }
                  }
                  currentCommand.right_on = false

                  this.$nextTick(()=>{
                    currentCommand.selected_columns = [
                      ...currentCommand.selected_columns,
                      ...(currentCommand._datasets_right[currentCommand.with] || []).map(n=>({name: n, source: 'right', key: n+'r'}))
                    ]
                    var items = getProperty(currentCommand.items_r_on,[currentCommand])
                    currentCommand.right_on = items ? (items[0] || false) : false
                  })
                  return currentCommand
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
                onClickRow: (item, currentCommand)=>{
                  var found = currentCommand.selected_columns.findIndex(it=>it.key===item.key)
                  if (found===-1) {
                    currentCommand.selected_columns.push(item)
                  } else {
                    this.$delete(currentCommand.selected_columns, found)
                  }
                  return currentCommand
                },
                selectKey: (item, currentCommand)=>{

                  try {
                    var on = item.source+'_on'
                    currentCommand[on] = item.name
                  } catch (error) {
                    console.error(error)
                  }

                  return currentCommand

                }
              },
            ],
            validate: (c) => {
              return !!(c.selected_columns && c.selected_columns.length && c.right_on)
            }
          },
          payload: async (columns, payload = {}) => {

            var _datasets_right = {...payload.secondaryDatasets}
            var items_with = Object.keys(_datasets_right).filter(e=>(e!==payload.dfName && e!=='preview_df'))

            var df2 = items_with[0]

            return {
              how: 'inner',
              _datasets_right,
              _unselect_on_change: {
                left: [],
                right: []
              },
              left_on: payload.allColumns[0],
              items_l_on: payload.allColumns,
              right_on: _datasets_right[df2][0],
              items_r_on: (c)=>c._datasets_right[c.with],
              with: df2,
              items_with: (c)=>{
                return Object.keys(c._datasets_right)
                  .filter(e=>e!==payload.dfName && e!=='preview_df')
                  .filter(e=>!e.startsWith('_'))
              },
              items_selected_columns: (c)=>{
                try {
                  return [
                    ...(c.allColumns || []).map(n=>({name: n, source: 'left', key: n+'l'})),
                    ...(c._datasets_right[c.with] || []).map(n=>({name: n, source: 'right', key: n+'r'}))
                  ]
                } catch (err) {}
              },
              selected_columns: [
                ...(payload.allColumns || []).map(n=>({name: n, source: 'left', key: n+'l'})),
                ...(_datasets_right[df2] || []).map(n=>({name: n, source: 'right', key: n+'r'}))
              ],
              preview: {
                joinPreview: (c)=>{
                  var left = c.selected_columns.filter(col=>col.source==='left' && col.name!==c.left_on).map(col=>col.name)
                  left = [...left, ...left.map(n=>n+'_left')]
                  var right = c.selected_columns.filter(col=>col.source==='right' && col.name!==c.right_on).map(col=>col.name)
                  right = [...right, ...right.map(n=>n+'_right')]
                  var center = [c.left_on, c.right_on, c.left_on+c.right_on, c.left_on+'_'+c.right_on]
                  return [ left, center, right ]
                },
                expectedColumns: -1,
                type: 'join',
                delay: 500,
                datasetPreview: true,
                // noBufferWindow: true
              },
              request: {
                // createsNew: true
              }
            }
          },
          beforeExecuteCode: async (currentCommand) => {
            var command = { ...currentCommand }
            if (!command.secondaryDatasets[command.with] || !command.secondaryDatasets[command.with].buffer) {
              await this.evalCode('_output = '+command.with+'.ext.set_buffer("*")') // TO-DO: !!!
              this.$store.commit('setSecondaryBuffer', { key: command.with, value: true})
              command.secondaryDatasets = {...this.currentSecondaryDatasets}
            }
            return command
          },
          content: (payload) => `<b>Join</b> ${hlParam(payload.dfName)} <b>with</b> ${hlParam(payload.with)}`
        },
        concat: {
          dialog: {
            title: 'Append datasets',
            fields: [
              {
                key: 'with',
                label: 'Dataset (right)',
                type: 'select',
                items_key: 'items_with'
              },
              {
                key: 'selected_columns',
                label: 'Concat columns',
                type: 'columns_concat'
              },
            ],
            validate: (c) => {
              return !!(c.selected_columns && c.selected_columns.length)
            }
          },
          payload: async (columns, payload = {}) => {

            var _datasets_right = {...payload.secondaryDatasets}
            var items_with = Object.keys(_datasets_right).filter(e=>(e!==payload.dfName && e!=='preview_df'))

            var df2 = items_with[0]

            return {
              items_with: (c)=>{
                return Object.keys(c._datasets_right)
                  .filter(e=>e!==payload.dfName && e!=='preview_df')
                  .filter(e=>!e.startsWith('_'))
              },
              with: df2,
              _datasets_right,
              dataset_columns: (c)=>{
                try {

                  return [
                    c.allColumns.map(name=>({
                      name,
                      type: (c.types && c.types.self) ? c.types.self[name] : '  '
                    })),
                    c._datasets_right[c.with].map(name=>({
                      name,
                      type: (c.types && c.types[c.with]) ? c.types[c.with][name] : '  '
                    }))
                  ];
                } catch (err) {
                  console.error(err);

                }
              },

              selected_columns: [],
              preview: {
                expectedColumns: -1,
                type: 'concat',
                delay: 500,
                datasetPreview: true,
                // noBufferWindow: true
              },
              request: {
                // createsNew: true
              }
            }
          },

          content: (payload) => `<b>Concat</b> ${hlParam(payload.dfName)} <b>with</b> ${hlParam(payload.with)}`,

          onInit: async (currentCommand) => {
            try {

              var command = {...currentCommand}
              if (!command.secondaryDatasets[command.with] || !command.secondaryDatasets[command.with].buffer) {
                await this.evalCode('_output = '+command.with+'.ext.set_buffer("*")') // TO-DO: !!!
                this.$store.commit('setSecondaryBuffer', { key: command.with, value: true})
                command.secondaryDatasets = {...this.currentSecondaryDatasets}
              }
              var withOther = command.items_with(command).map(df=>`"${df}": ${df}.cols.profiler_dtypes()`).join(', ')
              const response = await this.evalCode(`_output = { "self": ${command.dfName}.cols.profiler_dtypes(), ${withOther} }`)

              command.types = response.data.result
              command.typesDone = true

              return command
            } catch (err) {
              return { ...currentCommand, typesDone: true }
            }
          }
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
                  c.input_cols.push(c.allColumns[0])
                  c.aggregations.push('count')
                  c.output_cols.push('')

                  return c
                },
                removeOne: (c,i)=>{
                  c.input_cols.splice(i,1)
                  c.aggregations.splice(i,1)
                  c.output_cols.splice(i,1)
                  return c
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
          payload: (columns, payload = {}) => ({
            group_by: [],
            input_cols: columns,
            aggregations: columns.map(e=>'count'),
            output_cols_default: (c)=>c.aggregations.map((aggregation,i)=>`${aggregation}_${c.input_cols[i]}`),
            output_cols: columns.map(e=>''),
            preview: {
              type: 'aggregations',
              expectedColumns: (c)=>{
                var output_cols_default = c.output_cols_default(c)
                var aggregations = c.aggregations.map((oname,i)=>`"${c.output_cols[i] || output_cols_default[i]}": {"${c.input_cols[i]}":"${c.aggregations[i]}"}`)
                aggregations = [...new Set(aggregations)]
                return aggregations.length+c.group_by.length
              },
              datasetPreview: true,
              noBufferWindow: true,
            },
            request: {}
          }),
          content: (payload) => `<b>Group by</b> ${multipleContent([payload.group_by],'hl--cols')} <b>aggregate</b> ${multipleContent([payload.input_cols, payload.aggregations],['hl--cols', 'hl--param'],', ',' using ', false, false)}`
        },
        STRING: {
          dialog: {
            title: 'String operation',
            output_cols: true,
          },
          payload: (columns, payload = {}) => ({
            columns: columns,
            output_cols: columns.map(e=>''),
            preview: {
              type: 'STRING'
            }
          }),
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
        set_profiler_dtypes: {
          content: (payload) => `<b>Set data type</b> ${multipleContent([payload.columns],'hl--cols')} to ${multipleContent([payload.dtype],'hl--param')}`
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
          payload: (columns, payload = {}) => ({
            command: 'fill_na',
            columns: columns,
            fill: '',
            output_cols: columns.map(e=>''),
            preview: {
              type: 'fill_na'
            }
          }),
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
                type: 'file',
                onClear: 'clearFile'
              },
              {
                condition: (c)=>(c._fileInput && c._fileInput.toString() && c._fileInput!==c._fileLoaded),
                type: 'action',
                label: 'Preview',
                loading: '_fileUploading',
                loadingProgress: '_fileUploadingProgress',
                func: 'uploadFile'
              },
              {
                key: '_moreOptions',
                label: (c) => `More options: ${c._moreOptions ? 'Yes' : 'No'}`,
                type: 'switch'
              },
              {
                key: 'external_url',
                label: 'External url',
                placeholder: (c)=>{
                  var fileType = (c.file_type!='infer') ? c.file_type : (c._fileType)
                  fileType = fileType ? `.${fileType}` : ''
                  return `https://example.com/my_file${fileType}`
                },
                disabled: (c)=>c.url,
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
                  ((!c._moreOptions || c.file_type==='file') && ( c.url.endsWith('.xls') || c.url.endsWith('.xlsx') || c.external_url.endsWith('.xls') || c.external_url.endsWith('.xlsx') ))
                },
                key: 'sheet_name',
                label: `Sheet`,
                items_key: '_sheet_names',
                type: (c)=> c._sheet_names.length ? 'select' : 'number'
              },
            ],
            validate: (c) => {
              if (c.external_url==='' && c.url==='') {
                return 0
              }
              return !!(c.file_type!='csv' || c.sep)
            }

          },

          clearFile: (currentCommand) => {
            currentCommand._fileType = false;
            currentCommand._fileUploading = false;
            currentCommand._fileInput = [];
            currentCommand._fileName = '';
            currentCommand._meta = false;
            currentCommand._datasetName = false;
            currentCommand._fileLoaded = false;
            currentCommand.error = false;
            currentCommand.url = '';
          },

          uploadFile: async (currentCommand) => {
            try {
              currentCommand._fileUploading = true

              var attachment = {
                setProgress: (progress) => {
                  this.$set(this.currentCommand, '_fileUploadingProgress', progress)
                }
              }

              var response = await this.$store.dispatch('request/uploadFile',{file: currentCommand._fileInput, attachment})

              if (response.fileType) {
                currentCommand.file_type = response.fileType
              }
              currentCommand.url = response.fileUrl
              currentCommand._fileUploading = false
              currentCommand._datasetName = response.datasetName || false
              currentCommand._fileLoaded = currentCommand._fileInput
            } catch (error) {
              console.error(error)
              currentCommand.error = error
              currentCommand._fileUploading = false
            }
            this.currentCommand = currentCommand
          },

          payload: () => ({
            command: 'load file',
            _fileType: false,
            _fileUploading: false,
            _fileInput: [],
            _fileName: '',
            _fileLoaded: false,
            _moreOptions: false,
            file_type: 'csv',
            external_url: '',
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
            preview: {
              loadPreview: true,
              type: 'load',
              delay: 500,
            },
            request: {
              isLoad: true,
              createsNew: true
            }
          }),

          content: (payload) => {
            var infer = (payload.file_type==='file' || !payload._moreOptions)
            var fileType = (infer) ? payload._fileType : payload.file_type
            var fileName = payload._fileName
            return `<b>Load</b>`
            + ( fileName ? ` ${hlParam(fileName)}` : '')
            + ( (!fileName && fileType) ? ` ${fileType}` : '')
            + ' file'
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
          getClusters: async (currentCommand) => {

            try {

              var code

              if (currentCommand.algorithm == 'fingerprint')
                code = `from optimus.engines.dask.ml import keycollision as kc; _output = kc.fingerprint_cluster(${currentCommand.dfName}.ext.buffer_window("*"), input_cols="${currentCommand.columns[0]}", output="json")`
              else if (currentCommand.algorithm == 'n_gram_fingerprint')
                code = `from optimus.engines.dask.ml import keycollision as kc; _output = kc.n_gram_fingerprint_cluster(${currentCommand.dfName}.ext.buffer_window("*"), input_cols="${currentCommand.columns[0]}", n_size=${currentCommand.n_size}, output="json")`
              else
                throw 'Invalid algorithm type input'

              currentCommand.loading = true
              currentCommand.clusters = false
              currentCommand.error = false

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

              currentCommand = {
                ...currentCommand,
                valid: {
                  algorithm: currentCommand.algorithm,
                  threshold: currentCommand.threshold,
                  n_size: currentCommand.n_size,
                },
                clusters
              }

            } catch (err) {

              var _error = printError(err)
              currentCommand = {...currentCommand, error: _error, should_update: true}
            }

            currentCommand.loading = false

            this.currentCommand = currentCommand
          },
          payload: (columns, payload = {}) => {
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
          content: (payload) => { // TO-DO: Test
            return `<b>Clusterize</b> ${multipleContent([payload.clusters.map(e=>e.replace)], 'hl--param')} in ${hlCols(payload.columns[0])}`
          }
        },
        'set_column_format': {
          dialog: {
            title: 'Set date format',
            fields: [
              {
                type: 'field',
                key: 'output_format',
                label: 'Format'
              }
            ]
          }

        },
        'transform_format': {
          dialog: {
            title: 'Transform date format',
            fields: [
              {
                type: 'field',
                key: 'current_format',
                label: 'Previous format',
                mono: true
              },
              {
                type: 'field-suggestions',
                key: 'output_format',
                label: 'New format',
                mono: true,
                useFunctions: false,
                fuzzySearch: false,
                suggestions: (c) => ({ 'dateformat': [ ...new Set([...c.allColumnDateFormats, 'd-m-Y', 'd-m-y', 'd/m/Y', 'd/m/y', 'm-d-Y', 'm-d-y', 'm/d/Y', 'm/d/y', 'Y-m-d']) ] })
              },
            ],
            validate: (c)=>c.current_format && c.output_format,
          },
          payload: (columns, payload = {}) => {
            return {
              columns,
              current_format: payload.columnDateFormats[0] || 'Y-m-d',
              output_format: '',
              preview: {
                type: 'transform_format'
              }
            }
          },
          content: (payload)=>`<b>Date format transformed</b> from ${hlParam(payload.current_format)} to ${hlParam(payload.output_format)} on ${multipleContent([payload.columns],'hl--cols')}`

        },
        'get_from_datetime': {
          dialog: {
            title: (c)=>`Get ${TIME_NAMES[c.output_type].split(' (')[0]} from date`,
            output_cols: true,
          },
          payload: (columns, payload = {}) => {
            return {
              columns,
              output_cols: columns.map(e=>''),
              current_format: payload.columnDateFormats[0] || 'Y-m-d',
              output_type: payload.output_type || 'year',
              preview: {
                type: 'TIME'
              }
            }
          },
          content: (payload)=> {
            return `<b>Got</b> ${TIME_NAMES[payload.output_type]} from ${multipleContent([payload.columns],'hl--cols')}`
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
          getOutliers: async (currentCommand) => {

            try {

              var code

              if (currentCommand.algorithm == 'tukey')
                code = `outlier = ${currentCommand.dfName}.outliers.tukey("${currentCommand.columns[0]}")`
              else if (currentCommand.algorithm == 'z_score')
                code = `outlier = ${currentCommand.dfName}.outliers.z_score(columns="${currentCommand.columns[0]}", threshold=${currentCommand.threshold})`
              else if (currentCommand.algorithm == 'mad')
                code = `outlier = ${currentCommand.dfName}.outliers.mad(columns="${currentCommand.columns[0]}", threshold=${currentCommand.threshold})`
              else if (currentCommand.algorithm == 'modified_z_score')
                code = `outlier = ${currentCommand.dfName}.outliers.modified_z_score(columns="${currentCommand.columns[0]}", threshold=${currentCommand.threshold})`
              else
                throw 'Invalid algorithm type input'

              currentCommand.loading = true

              var response = await this.evalCode(`import json; ${code}; _output = json.dumps(outlier.info(), ensure_ascii=False)`)

              var outliers_data = parseResponse(response.data.result)

              if (!outliers_data) {
                throw response
              }

              if ( ['tukey','mad'].includes(currentCommand.algorithm) ) {

                var hist_response = await this.evalCode(`_output = outlier.hist("${currentCommand.columns[0]}")`)
                var hist_data = parseResponse(hist_response.data.result)

                if (!hist_data) {
                  throw hist_response
                }

                var hist = hist_data[currentCommand.columns[0]].hist

                outliers_data = { ...outliers_data, hist }

              }

              currentCommand = {
                ...currentCommand,
                valid: {
                  algorithm: currentCommand.algorithm,
                  threshold: currentCommand.threshold,
                },
                data: outliers_data,
                selection: [],
                code_done: code
              }


            } catch (err) {

              var _error = printError(err)
              currentCommand = {...currentCommand, error: _error, data: false, selection: []}
            }

            currentCommand.loading = false

            this.currentCommand = currentCommand
          },
          payload: (columns, payload = {}) => {
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
          content: (payload) => { // TO-DO: Test
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
            request: {
              isLoad: true,
              createsNew: true
            }
          }),
          content: (payload)=>{
            var database = ['postgres','presto','redshift','sqlserver','mysql'].includes(payload.driver)
            return `<b>Load</b> ${hlParam(payload.table)}`
            +(database ? ` from ${hlParam(payload.database)}` : '')
            + ' to '+hlParam(payload.newDfName)
          },

          getTables: async (currentCommand) => {

            currentCommand._loadingTables = true
            currentCommand.error = ''

            var fields = this.commandsHandlers['load from database'].dialog.fields

            try {
              var driver = escapeQuotes(currentCommand.driver)
              var code = `db = op.connect(driver="${driver}"`

              fields.forEach(field => {
                if (!['driver','oracle_type', 'table', undefined].includes(field.key)) {
                  code += (
                    (!field.condition || field.condition(currentCommand) && currentCommand[field.key] && field.key) ?
                    `, ${field.key}="${escapeQuotes(currentCommand[field.key])}"` : ''
                  )
                }
              });

              code += ')'

              var response = await this.evalCode(code+`; _output = db.tables_names_to_json()`)

              if (response.data.status === 'error') {
                throw response.data.error
              }

              var tables = response.data.result

              if (!tables || !tables.length) {
                throw 'Database has no tables'
              }

              this.$store.commit('database',true)

              currentCommand = {
                ...currentCommand,
                tables,
                table: tables[0],
                previous_code: code,
                validDriver: currentCommand.driver,
                validHost: currentCommand.host,
                validDatabase: currentCommand.database
              }
            } catch (err) {
              var _error = printError(err)
              currentCommand = {...currentCommand, error: _error}
            }

            currentCommand._loadingTables = false

            this.currentCommand = currentCommand
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
          payload: (columns, payload = {}) => ({
            command: 'stratified_sample',
            seed: 1,
            columns: columns,
          }),
          content: (payload) => { // TO-DO: Test
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
          payload: (columns, payload = {}) => ({
            command: 'replace',
            columns: columns,
            search: [],
            replace: '',
            search_by: 'chars',
            output_cols: columns.map(e=>e),
            match_case: false,
            title: 'Replace in ' + (columns.length==1 ? `column` : 'columns'),
            preview: {
              type: 'replace',
              highlightColor: {default: 'red', preview: 'green'}
            },
          }),
          content: (payload)=>`<b>Replace</b> ${multipleContent([payload.search],'hl--param')} with ${hlParam(payload.replace)} in ${multipleContent([payload.columns],'hl--cols')}`
        },
        set: {
          dialog: {
            fields: [
              {
                type: 'field-suggestions',
                key: 'value',
                placeholder: 'Expression or "value"',
                label: 'Expression',
                mono: true,
                suggestions: (c) => ({ 'column': c.allColumns }),
                useFunctions: true,
                fuzzySearch: true
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
          payload: (columns, payload = {}) => ({
            command: 'set',
            columns,
            value: (columns[0] ? (columns[0].includes(' ') ? `{${columns[0]}}` : columns[0]) : ''),
            where: (columns[0] ? `${columns[0]}!=None` : ''),
            title: (columns[0] ? `Set column` : 'Create column'),
            preview: {
              expectedColumns: 1,
              type: 'set'
            },
            output_col: 'new_column',
            output_cols: columns.map(e=>'')
          }),
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
          payload: (columns, payload = {}) => {
            return {
              command: 'rename',
              columns,
              output_cols: columns.map(e=>newName(e)),
              preview: {
                fake: 'rename'
              }
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
          payload: (columns, payload = {}) => {
            return {
              command: 'unnest',
              columns,
              separator: ', ',
              splits: 2,
              index: '',
              drop: false,
              output_cols: columns.map(e=>e),
              preview: {
                type: 'unnest',
                expectedColumns: (c) => c.splits,
                highlightColor: 'red'
              },
            }
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
          payload: (columns, payload = {}) => {
            return {
              command: 'nest',
              columns,
              separator: ', ',
              title: 'Nest '+(columns.length==1 ? `column` : 'columns'),
              defaultOutputName: columns.join('_'),
              output_col: columns.join('_'),
              preview: {
                type: 'nest',
                expectedColumns: 1,
                highlightColor: 'green'
              },
            }
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
          payload: (columns, payload = {}) => {
            return {
              command: 'duplicate',
              columns,
              title: 'Duplicate '+(columns.length==1 ? `column` : 'columns'),
              output_cols: columns.map(e=>newName(e)),
              preview: {
                fake: 'duplicate'
              }
            }
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
          payload: (columns, payload = {}) => {
            return {
              command: 'bucketizer',
              columns: columns,
              splits: 2,
              output_cols: columns.map(e=>'')
            }
          },
          content: (payload) => { // TO-DO: Test
            return `<b>Bucketize</b> `
            + columnsHint(payload.columns,payload.output_cols)
            + (payload.splits ? `by ${hlParam(payload.splits)}` : '')
          }

        },
        values_to_cols: {
          payload: (columns, payload = {}) => {
            return {
              command: 'values_to_cols',
              columns: columns
            }
          },
          content: (payload) => { // TO-DO: Test
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
          payload: (columns, payload = {}) => {
            return {
              command: 'string_to_index',
              columns: columns,
              output_cols: columns.map(e=>'')
            }
          },
          content: (payload) => { // TO-DO: Test
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
          payload: (columns, payload = {}) => {
            return {
              command: 'index_to_string',
              columns: columns,
              output_cols: columns.map(e=>'')
            }
          },
          content: (payload) => { // TO-DO: Test
            return `<b>Set indices to strings</b> `
            + columnsHint(payload.columns,payload.output_cols)
          }
        },
        ML: { // TO-DO: Test
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
          payload: (columns, payload = {}) => {
            return {
              columns: columns,
              output_cols: columns.map(e=>'')
            }
          },
          content: (payload) => { // TO-DO: Test
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
          payload: (columns, payload = {}) => {
            return {
              command: 'impute',
              data_type: 'continuous',
              strategy: 'mean',
              columns: columns,
              output_cols: columns.map(e=>'')
            }
          },
          content: (payload) => { // TO-DO: Test
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
          payload: (columns, payload = {}) => {
            return {
              command: 'sample_n',
              n: 10,
              columns: columns,
            }
          },
          content: (payload) => { // TO-DO: Test
            return `<b>Sample</b> to ${hlParam(payload.n)} rows`
          }
        },
      },

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
      'currentSecondaryDatasets',
      'loadPreview',
      'hasSecondaryDatasets'
    ]),

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
        return this.getCommandHandler(this.currentCommand)
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

    previewError () {
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

    codeError (value) {
      // if (value && value.length) {
      //   this.$store.commit('clearDatasetProperties');
      // }
    },

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
        if (c.command==='load file' && meta) {
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
          var command = this.getCommandHandler(this.currentCommand)
          if (command && command.dialog) {
            var valid = (!command.dialog.validate) ? true : command.dialog.validate(this.currentCommand)
            if (valid===0) {
              this.restorePreview(true)
              return
            }

            if (this.currentCommand.preview && (this.currentCommand.preview.type)) {

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
            if (this.currentCommand.preview.fake==='rename') {
              var nameMap = {}
              this.currentCommand.output_cols.forEach((col, i) => {
                nameMap[this.currentCommand.columns[i]] = col
              })
              this.$store.commit('setPreviewNames',nameMap)
            } else if (this.currentCommand.preview.fake==='duplicate') {
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

    getNewDfName () {

      var name = 'df'

      var sd = Object.keys(this.currentSecondaryDatasets)
        .filter(e=>e.startsWith(name))

      if (sd.length) {
        var i = (parseInt(sd[sd.length-1].split(name)[1]) || 0)+1
        if (i) {
          name = name+i
        }
      }

      return name
    },

    runCells (force, ignoreFrom) {
      var payload = { force, ignoreFrom, socketPost: this.socketPost };
      return this.$store.dispatch('getCellsResult', {forcePromise: true, payload });
    },

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
        await this.cancelCommand()
        await this.runCodeNow()
        var payload = {
          dfName: this.currentDataset.dfName,
          username: this.$store.state.session.username,
          workspace: this.$route.params.slug
        }
        var response = await this.socketPost('download', payload )
        this.forceFileDownload(response.data.url)
      } catch (error) {
        console.error(error)
      }
    },

    restorePreview (restoreColumns) {
      if (restoreColumns) {
        this.$store.commit('previewDefault')
        return
      }
      if (this.previewCode) {
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

    cleanCodeError () {
      this.codeError = '';
    },

    preparePreviewCode: debounce( async function() {

      try {

        var expectedColumns

        if (this.currentCommand.preview.expectedColumns!==undefined) {
          expectedColumns = getProperty(this.currentCommand.preview.expectedColumns, [this.currentCommand])
        } else if (this.currentCommand.output_cols && this.currentCommand.output_cols.length) {
          expectedColumns = this.currentCommand.output_cols.length
        } else if (this.currentCommand.columns) {
          expectedColumns = this.currentCommand.columns.length
        }

        var commandHandler = this.command

        this.$store.commit('setPreviewCode',{
          code: this.getCode(this.currentCommand, 'preview'),
          profileCode: this.getCode(this.currentCommand, 'profile'),
          beforeCodeEval: this.currentCommand.beforeCodeEval ? ()=>this.currentCommand.beforeCodeEval(this.currentCommand) : false,
          color: getProperty(this.currentCommand.preview.highlightColor, [this.currentCommand]),
          from: this.currentCommand.columns,
          datasetPreview: !!getProperty(this.currentCommand.preview.datasetPreview, [this.currentCommand]),
          loadPreview: !!getProperty(this.currentCommand.preview.loadPreview, [this.currentCommand]),
          load: this.currentCommand.preview.type==='load',
          infer: this.currentCommand._moreOptions===false, // TO-DO: Check
          noBufferWindow: getProperty(this.currentCommand.preview.noBufferWindow,[this.currentCommand]),
          joinPreview: getProperty(this.currentCommand.preview.joinPreview, [this.currentCommand]),
          expectedColumns,
        })

        // TO-DO: Generalize

      } catch (err) {
        console.error(err) // probably just a cancelled request
      }


    }, 10),

    getCommandTitle() {
      try {
        if (this.command.dialog.title) {
          return getProperty(this.command.dialog.title, [this.currentCommand])
        }
        return getProperty(this.currentCommand.title, [this.currentCommand])
      }
      catch (err) {
        return 'Operation'
      }
    },

    getCommandHandler (command) {
      return this.commandsHandlers[command.command] || this.commandsHandlers[command.type]
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
      return this.$store.dispatch('beforeRunCells', {newOnly, ignoreFrom});
    },

    async commandHandle (command) {

      await this.cancelCommand();

      if (command.empty) {
        this.runCodeNow()
        return
      }

      if (this.selectionType!=='text') {
        this.clearTextSelection()
      }

      this.$store.commit('setPreviewColumns',false)

      var columns = undefined
      var columnDataTypes = undefined
      var columnDateFormats = undefined

      if (!command.columns || !command.columns.length) {
        columns = this.columns.map(e=>this.currentDataset.columns[e.index].name)
        columnDataTypes = this.columns.map(e=>this.currentDataset.columns[e.index].profiler_dtype.dtype)
        columnDateFormats = this.columns.map(e=>transformDateFromPython(this.currentDataset.columns[e.index].profiler_dtype.format)).filter(e=>e);
      } else {
        columns = command.columns
        var columnIndices = namesToIndices(columns, this.currentDataset.columns)
        columnDataTypes = columnIndices.map(i=>this.currentDataset.columns[i].profiler_dtype.dtype)
        columnDateFormats = columnIndices.map(i=>transformDateFromPython(this.currentDataset.columns[i].profiler_dtype.format)).filter(e=>e);
      }

      var allColumnDateFormats = this.allColumns.map((e,i)=>transformDateFromPython(this.currentDataset.columns[i].profiler_dtype.format)).filter(e=>e);

      var commandHandler = this.getCommandHandler(command)

      // default payload

      var payload = {
        request: {
          isLoad: false,
          createsNew: false,
          noOperations: command.noOperations,
          immediate: command.immediate,
          isString: columnDataTypes && columnDataTypes.every(d=>STRING_TYPES.includes(d)),
        },
        secondaryDatasets: this.currentSecondaryDatasets,
        columnDataTypes: columnDataTypes,
        columnDateFormats: columnDateFormats,
        allColumnDateFormats: allColumnDateFormats,
        dfName: this.currentDataset.dfName,
        newDfName: this.getNewDfName(),
        allColumns: this.allColumns,
        type: command.type,
        command: command.command,
      }

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
          ...(command.payload || {})
        }

        if (commandHandler.dialog) {

          this.currentCommand = payload

          this.$emit('updateOperations', { active: true, title: this.getCommandTitle() })
          this.$emit('update:big',commandHandler.dialog.big)

          if (commandHandler.onInit) {
            this.currentCommand = await commandHandler.onInit(this.currentCommand)
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
          this.addCell(-1, {
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
      if (commandHandler.onDone) {
        this.currentCommand = await commandHandler.onDone(this.currentCommand);
      }

      var code = this.getCode(this.currentCommand);
      var content = this.getOperationContent(this.currentCommand);

      var toCell = this.currentCommand._toCell!==undefined ? this.currentCommand._toCell : -1;

      this.addCell(toCell, { ...this.currentCommand, code, content }, true );

      this.$emit('updateOperations', { active: (this.currentCommand.request.noOperations ? false : true), title: 'operations' } );

      this.currentCommand = false;
    },

    cancelCommand () {
      return new Promise((resolve, reject)=>{
        setTimeout(() => {
          // this.recoverTextSelection();
          this.clearTextSelection();
          this.currentCommand = false;
          this.$emit('updateOperations', {
            active: false,
            title: 'operations'
          });
          this.$store.commit('previewDefault');
          this.runCodeNow(this.isEditing);
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

      var from = isDataSource ? this.localDataSources : this.localCommands

      if (index<0 || !from[index]) {
        return
      }

      var currentPayload = from[index].payload

      if (currentPayload.request && currentPayload.request.createsNew) {
        var filteredCells = this.cells.filter(cell => cell.payload.dfName===currentPayload.newDfName && !cell.payload.request.isLoad)
        if (filteredCells.length>0) {
          console.warn('[CELLS] Cannot remove, there are cells using this variable as input')
          return
        }
      }

      this.codeError = '';

      var cells = [...from]
      var deletedPayload = cells.splice(index,1)[0].payload

      var deleteTab = false

      if (deletedPayload.request && deletedPayload.request.createsNew) {
        var deleteDf = deletedPayload.newDfName
        if (deleteDf) {
          deleteTab = currentPayload.newDfName
          this.evalCode(`del ${deleteDf}; _output = "Deleted ${deleteDf}"`)
          this.updateSecondaryDatasets()
        }
      }

      if (deleteTab) {
        await this.$store.dispatch('newDataset', { dfName: deleteTab, current: true })
      }

      if (isDataSource) {
        this.localDataSources = cells
      } else {
        this.localCommands = cells
      }

      // if (index>=from.length) {
      //   index = from.length-1
      // }

      this.codeDone = ''
      this.draggableEnd(true)
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
      } else {
        content += `<span class="hint--df"> in ${hlParam(payload.dfName)}</span>`
      }

      return content
    },

    getCode (currentCommand, type = 'final') {

      var payload = {...currentCommand}

      var code = ''

      if (!payload.columns || !payload.columns.length) {
        // console.warn('Auto-filling columns')
        payload.columns = this.columns.map(e=>this.currentDataset.columns[e.index].name)
      }

      var precode = ''

      if (!payload._code) {
        var generator = getGenerator(payload.command, payload)
        if (generator === undefined) {
          var commandHandler = this.getCommandHandler(payload)
          generator = commandHandler.code
        }
        code = generator ? generator({
          ...payload,
          request: { ...(payload.request || {}), type }
        }) : ''
      }
      else {
        code = payload._code
      }

      if (type==='preview') {
        return code
      } else if (type==='profile') {
        return code
      } else {
        if (payload.request && payload.request.createsNew) {

          return precode + code +'\n'
					+`${payload.newDfName} = ${payload.newDfName}.ext.repartition(8).ext.cache()`
        } else {
          return precode + `${payload.dfName} = ${payload.dfName}${code}.ext.cache()`
        }
      }

    },

    async editCell (cell, index) {
      // console.debug('[DEBUG] Editing cell',{cell, index})
      var command = deepCopy(cell)

      var commandHandler = this.getCommandHandler(command)

      if (commandHandler.dialog) {
        this.commandsDisabled = true;
        await this.runCodeNow(true, index)
        this.commandsDisabled = false;
        command.payload._toCell = index
        this.commandHandle(command)
        this.isEditing = true
      }
    },

    addCell (at = -1, payload = {command: 'code', code: '', content: '', ignoreCell: false, noCall: false, deleteOtherCells: false}, replace = false) {

      var {command, code, ignoreCell, deleteOtherCells, content} = payload

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

      if (!payload.noCall) {
        this.$nextTick(async ()=>{
          var run = false;
          if (code.length) {
            run = await this.runCodeNow(false, -1, payload.newDfName);
          }
          if (!run) {
            console.warn('[CELLS] Nothing to run')
            this.$store.commit('previewDefault');
          }
        });
      } else {
        this.$store.commit('previewDefault');
      }

    },

    async runCodeNow (force = false, ignoreFrom = -1, newDfName, noCheck = false) {

      console.trace();

      try {
        var dfName = (this.currentDataset ? this.currentDataset.dfName : undefined) || newDfName;

        var cellsResult = await this.runCells(force, ignoreFrom)
        console.debug('[INITIALIZATION] Cells code done', cellsResult);

        if (!cellsResult) {
          return false;
        }

        var dataset = await this.getProfiling(dfName, ignoreFrom)
        console.debug('[INITIALIZATION] Profiling done', dataset);

        if (this.firstRun) {
          this.firstRun = false;
        }

        var secondaryDatasets = this.updateSecondaryDatasets()
        console.debug('[INITIALIZATION] Secondary datasets promise', secondaryDatasets);

        this.$forceUpdate();

        this.markCells(true, ignoreFrom);

        this.codeError = '';
        this.lastWrongCode = false

      } catch (err) {
        if (noCheck) {
          throw err;
        }
        console.error('Error running code', err);
      }

      if (!noCheck) {
        var codeText = await this.codeText();

        var code = cellsResult ? cellsResult.originalCode : undefined;

        console.log(codeText, code)

        if (codeText !== code) {
          setTimeout(() => {
            this.runCodeNow(false)
          }, 1000);
        }
      }


      return !this.lastWrongCode;


    },

    runCode: debounce( async function (force = false) {
      await this.runCodeNow(force)
    }, 1000),
  }
}
</script>
