<template>
  <div>
		<template v-for="(command, key) in commandsPallete">
			<v-dialog
				:key="key"
				persistent
				v-if="command.dialog && (currentCommand.command == key || currentCommand.type == key)"
				:value="(currentCommand.command == key || currentCommand.type == key)"
				:max-width="command.dialog.big ? 820 : 410"
				@click:outside="cancelCommand"
				@keydown.esc="cancelCommand"
			>
				<v-form @submit.prevent="confirmCommand" id="command-form">
					<v-card class="command-dialog" ref="command-dialog">
						<v-card-title class="title px-6">
							{{
								command.dialog.title ?
								(
									typeof command.dialog.title == 'function' ?
										command.dialog.title(currentCommand)
									:
										command.dialog.title
								)
								:
									currentCommand.title
							}}
						</v-card-title>
						<v-card-text class="command-card-text pb-0 px-6" :class="{'command-big': command.dialog.big}">
							<div class="mb-6" v-if="command.dialog.text">
								{{
									(typeof command.dialog.text == 'function') ?
										command.dialog.text(currentCommand)
									:
										command.dialog.text
								}}
							</div>
              <div class="progress-middle" style="height: 86%">
                <v-progress-circular
                  indeterminate
                  color="#888"
                  size="64"
                  v-if="currentCommand.loading"
                />
              </div>
              <template v-if="!currentCommand.loading && command.dialog.fields">
                <template v-for="field in command.dialog.fields.filter(f=>(!f.condition || f.condition && f.condition(currentCommand)))">
                  <template v-if="field.type=='field'">
                    <v-text-field
                      v-model="currentCommand[field.key]"
                      :key="field.key"
                      :label="(typeof field.label == 'function') ? field.label(currentCommand) : (field.label || '')"
                      :placeholder="(typeof field.placeholder == 'function') ? field.placeholder(currentCommand) : (field.placeholder || '')"
                      :clearable="field.clearable"
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
                  <template v-if="field.type=='switch'">
                    <v-switch
                      :key="field.key"
                      v-model="currentCommand[field.key]"
                      color="black"
                      class="mt-0"
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
                      dense
                      required
                      outlined
                    ></v-select>
                  </template>
                  <template v-else-if="field.type=='select-foreach'">
                    <v-row :key="field.key" no-gutters style="align-items: center">
                      <template v-for="(title, i) in currentCommand.columns">
                        <v-col v-if="!field.noLabel" :key="i+'label'" class="col-12 col-sm-4 col-md-3 font-weight-bold pr-4 text-ellipsis" :title="title">
                          {{title}}
                        </v-col>
                        <v-col :key="i" class="col-12 oci-input-container" :class="{'col-sm-8 col-md-9': !field.noLabel}">
                          <v-select
                            class="mb-4"
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
						</v-card-text>
						<v-card-actions>
							<div class="flex-grow-1"/>
							<v-btn
								color="primary"
								text
                v-if="command.onTest"
                :loading="currentCommand.loadingTest"
								@click="command.onTest(currentCommand)"
							>
								{{ command.dialog.testLabel || 'Test'}}
							</v-btn>
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
								:disabled="command.dialog.validate && !command.dialog.validate(currentCommand)"
                :loading="currentCommand.loadingAccept"
								type="submit"
								form="command-form"
							>
								{{ command.dialog.acceptLabel || 'Accept'}}
							</v-btn>
						</v-card-actions>
					</v-card>
				</v-form>
			</v-dialog>
		</template>
    <div class="sidebar-content options-fields-container" ref="cells-container" :class="{'empty': !cells.length}">
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
        <div class="cell-container" v-for="(cell, index) in this.cells" :key="cell.id" :class="{'fixed-cell': cell.fixed, 'cell-error': cell.error,'done': cell.done,'active': activeCell>=0 && activeCell==index}" @click="setActiveCell(index)">

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
      <v-alert key="error" type="error" class="mt-3" dismissible v-if="codeError!=''"  @input="codeError=''">
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

import axios from 'axios'
import CodeEditor from '@/components/CodeEditor'
import OutputColumnInputs from '@/components/OutputColumnInputs'
import clientMixin from '@/plugins/mixins/client'
import { trimCharacters, debounce, newName, arrayJoin } from '@/utils/functions.js'

const api_url = process.env.API_URL || 'http://localhost:5000'

const sl = `
`

export default {

  components: {
    CodeEditor,
    OutputColumnInputs,
  },

  mixins: [clientMixin],

  props: {
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
      codeError: '',
      firstRun: true,
      runButton: false,

      commandsPallete: {
        'apply sort': {
          code: (payload) => {
            return `${this.dataset.varname} = ${this.dataset.varname}.cols.sort(columns=["${payload.columns.join('", "')}"])`
          }
        },
        DROP_KEEP: {
          code: (payload) => {
            return `${this.dataset.varname} = ${this.dataset.varname}.cols.${payload.command}(["${payload.columns.join('", "')}"])`
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
            return `${this.dataset.varname} = ${this.dataset.varname}.rows.sort( ${_argument} )`
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
                  { text: 'Custom expression', value: 'custom' }
                ]
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
                default:
                  return false
              }
            }
          },

          payload: (columns) => ({
            columns,
            condition: 'exactly',
            value: '',
            values: [],
            value_2: '',
            text: '',
            expression: `${this.dataset.varname}["${columns[0]}"]`,
            action: 'select'
          }),

          code: (payload) => {

            var expression = payload.expression

            switch (payload.condition) {
              case 'exactly':
                expression = `${this.dataset.varname}["${payload.columns[0]}"]==${payload.value}`
                break
              case 'oneof':
                expression = `${this.dataset.varname}.${payload.columns[0]}.isin("${payload.values.join('","')}")`
                break
              case 'not':
                expression = `${this.dataset.varname}["${payload.columns[0]}"]!=${payload.value}`
                break
              case 'less':
                expression = `${this.dataset.varname}["${payload.columns[0]}"]<=${payload.value}`
                break
              case 'greater':
                expression = `${this.dataset.varname}["${payload.columns[0]}"]>=${payload.value}`
                break
              case 'between':
                expression = `(${this.dataset.varname}["${payload.columns[0]}"]>=${payload.value}) & (${this.dataset.varname}["${payload.columns[0]}"]<${payload.value_2})`
                break
              case 'contains':
                expression = `${this.dataset.varname}["${payload.columns[0]}"].contains("${payload.text}")`
                break
              case 'startswith':
                expression = `${this.dataset.varname}["${payload.columns[0]}"].startswith("${payload.text}")`
                break
              case 'endswith':
                expression = `${this.dataset.varname}["${payload.columns[0]}"].endswith("${payload.text}")`
                break
              case 'custom':
              default:
            }

            return `${this.dataset.varname} = ${this.dataset.varname}.rows.${payload.action}( ${expression} )` // ${this.dataset.varname}.rows.${payload.action}()
          }
        },
        STRING: {
          code: (payload) => {
            var _argument = payload.columns.length==0 ? `"*"`
            : (payload.columns.length==1 ? `"${payload.columns[0]}"` : `input_cols=["${payload.columns.join('", "')}"]`)
            return `${this.dataset.varname} = ${this.dataset.varname}.cols.${payload.command}(${_argument})`
          }
        },
        cast: {
          code: (payload) => {
            var _argument = (payload.columns.length==1) ? `"${payload.columns[0]}"` : `["${payload.columns.join('", "')}"]`
            return `${this.dataset.varname} = ${this.dataset.varname}.cols.cast(`
            +_argument
            +`, dtype="${payload.dtype}"`
            +')'
          }
        },
        fill_na: {
          dialog: {
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
            title: 'Fill in ' + (columns.length==1 ? `column` : 'columns'),
          }),
          code: (payload) => {
            var _argument = (payload.columns.length==1) ? `"${payload.columns[0]}"` : `["${payload.columns.join('", "')}"]`
            var output_cols_argument =
              (!payload.output_cols.join('').trim().length) ? false :
              (payload.output_cols.length==1) ? `"${payload.output_cols[0]}"` :
              `[${payload.output_cols.map((e)=>((e!==null) ? `"${e}"` : 'None')).join(', ')}]`
            return `${this.dataset.varname} = ${this.dataset.varname}.cols.fill_na(`
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
                key: 'url',
                label: 'File url',
                placeholder: (c)=>`https://example.com/my_file.${c.file_type}`,
                type: 'field'
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

          payload: () => ({
            command: 'load file',
            file_type: 'csv',
            url: '',
            sep: ',',
            sheet_name: '0',
            header: true,
            limit: '',
            multiline: true,
            charset: 'UTF-8'
          }),

          code: (payload) => {
            let file = {
              ...payload,
              header: (payload.header) ? `'true'` : `'false'`,
              multiline: (payload.multiline) ? `True` : `False`,
            }
            let code = `${this.availableVariableName} = op.load.${file.file_type}("${file.url}"`
            if (file.file_type=='csv'){
              code += `, sep="${file.sep}"`
              code += `, header=${file.header}`
              code += `, infer_schema='true'`
              code += `, charset="${file.charset}"`
            }
            else if (file.file_type=='json'){
              code += `, multiline=${file.multiline}`
            }
            else if (file.file_type=='xls'){
              code += `, sheet_name="${file.sheet_name}"`
            }

            code += `)`

            if (file.limit>0) {
              code +=`.rows.limit(${file.limit})`
            }

            code += '.cache()'

            return code
          }
        },
        'string clustering': {
          dialog: {
            big: true,
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
                ],
                onChange: 'onInit'
              },
              {
                type: 'clusters',
                key: 'clusters'
              }
            ],
            contentMinHeight: 160,
            validate: (c) => (c.clusters)
          },
          onInit: async () => {

            try {

              var code

              if (this.currentCommand.algorithm == 'levenshtein')
                code = `from optimus.ml import distancecluster as dc${sl}dc.levenshtein_cluster(${this.dataset.varname}, "${this.currentCommand.columns[0]}", output="json")`
              else if (this.currentCommand.algorithm == 'fingerprint')
                code = `from optimus.ml import keycollision as kc${sl}kc.fingerprint_cluster(${this.dataset.varname}, input_cols="${this.currentCommand.columns[0]}", output="json")`
              else if (this.currentCommand.algorithm == 'n_gram_fingerprint')
                code = `from optimus.ml import keycollision as kc${sl}kc.n_gram_fingerprint_cluster(${this.dataset.varname}, input_cols="${this.currentCommand.columns[0]}", n_size=2, output="json")`
              else
                throw 'Invalid algorithm type input'

              this.currentCommand.loading = true

              var response = await this.evalCode(code)

              var clusters = JSON.parse(trimCharacters(response.content,"'"))

              console.log('clusters',clusters)

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

              if (!clusters.length){
                throw 'No clusters found'
              }

              this.currentCommand = {
                ...this.currentCommand,
                clusters
              }

            }
            catch (error) {

              console.error(error)
              var _error = error
              if (error.content.ename)
                _error = error.content.ename
              if (error.content.evalue)
                _error += ': '+error.content.evalue
              this.currentCommand = {...this.currentCommand, error: _error}
            }

            this.currentCommand.loading = false
          },
          payload: (columns) => {
            return {
              columns,
              algorithm: 'levenshtein',
              clusters: false,
              loading: true
            }
          },
          code: (payload) => {
            return payload.clusters
            .filter(cluster=>cluster.selected.length)
            .map(cluster=>{
              var values = cluster.selected.map(e=>e.value)
              return `${this.dataset.varname} = ${this.dataset.varname}.cols.replace(`
              +`"${payload.columns[0]}"`
              +`, search=["${values.join('","')}"]`
              +`, replace_by="${cluster.replace}"`
              +`, search_by="full"`
              +')'
            })
            .join('\n')
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
            driver: 'mysql',
            host: '',
						database: '',
						user: '',
            password: '',
            loadingTest: false
          }),
          code: (payload) => {
            return `${payload.previous_code}
${this.availableVariableName} = db.table_to_df("${payload.table}").cache()`
          },
          onTest: async (payload) => {

            this.currentCommand.loadingTest = true
            this.currentCommand.error = ''

            var fields = this.commandsPallete['load from database'].dialog.fields

            try {
              var code = `db = op.connect(driver="${payload.driver}"`

              fields.forEach(field => {
                if (field.key!='driver' && field.key!='oracle_type' && field.key!='table') {
                  code += (
                    (!field.condition || field.condition(this.currentCommand) && payload[field.key]!==undefined) ?
                    `, ${field.key}="${payload[field.key]}"` : ''
                  )
                }
              });

              code += ')'

              var response = await this.evalCode(code+`
db.tables_names_to_json()`)

              var tables = JSON.parse(trimCharacters(response.content,"'"))
              if (!tables.length){
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
            }
            catch (error) {

              console.error(error)

              var _error = error

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
          code: (payload) => (`${this.dataset.varname}.save.${payload.format}("${payload.file_name}")`)
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
          code: (payload) => (`db.df_to_table(${this.dataset.varname}, table="${payload.table_name}", mode="overwrite")`)
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
					}),
          code: (payload) => {
            var _argument = (payload.columns.length==1) ? `"${payload.columns[0]}"` : `["${payload.columns.join('", "')}"]`
            var output_cols_argument =
              (!payload.output_cols.join('').trim().length) ? false :
              (payload.output_cols.length==1) ? `"${payload.output_cols[0]}"` :
              `[${payload.output_cols.map((e)=>((e!==null) ? `"${e}"` : 'None')).join(', ')}]`
            return `${this.dataset.varname} = ${this.dataset.varname}.cols.replace(`
              +_argument
              +`, search=["${payload.search.join('","')}"]`
              +`, replace_by="${payload.replace}"`
              +`, search_by="${payload.search_by}"`
              +( (output_cols_argument) ? `, output_cols=${output_cols_argument}` : '')
              +')'
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
              // (columns.length==0) ?
              //   'Create column'
              // : (columns.length==1) ?
              //     `Create column from "payload.${columns[0]}"`
              //   :
              //     'Create column from columns',
            newName: '' // columns.length==1 ? newName(columns[0]) : ''
          }),
          code: (payload) => {
            return `${this.dataset.varname} = ${this.dataset.varname}.cols.set("${payload.newName}"`
            +( (payload.expression) ? `, ${payload.expression}` : '')
            +`)`
          }
        },
        rename: {
          dialog: {
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
              title: 'Rename '+(columns.length==1 ? `column` : 'columns'),
              output_cols: columns.map(e=>newName(e))
            }
          },
          code: (payload) => {
            if (payload.columns.length==1) {
              return `${this.dataset.varname} = ${this.dataset.varname}.cols.rename("${payload.columns[0]}", "${payload.output_cols[0]}")`
            }
            else {
              return `${this.dataset.varname} = ${this.dataset.varname}.cols.rename([${payload.columns.map((e,i)=>`("${e}", "${payload.output_cols[i]}")`)}])`
            }
          }
        },
        unnest: {
          dialog: {
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
              title: 'Unnest '+(columns.length==1 ? `column` : 'columns'),
              output_cols: columns.map(e=>e)
            }
					},
					code: (payload) => {
            var _argument = (payload.columns.length==1) ? `"${payload.columns[0]}"` : `["${payload.columns.join('", "')}"]`
            var output_cols_argument =
              (!payload.output_cols.join('').trim().length) ? false :
              (payload.output_cols.length==1) ? `"${payload.output_cols[0]}"` :
              `[${payload.output_cols.map((e)=>((e!==null) ? `"${e}"` : 'None')).join(', ')}]`
            return `${this.dataset.varname} = ${this.dataset.varname}.cols.unnest(`
              +_argument
              +( (payload.separator) ? `, separator="${payload.separator}"` : '')
              +( (payload.splits) ? `, splits=${payload.splits}` : '')
              +( (payload.index) ? `, index=${payload.index}` : '')
              +( (output_cols_argument) ? `, output_cols=${output_cols_argument}` : '')
              +')'
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
							newName: ''
					}
          },
					code: (payload) => {
            return `${this.dataset.varname} = ${this.dataset.varname}.cols.nest(["${payload.columns.join('", "')}"]`
						+( (payload.separator) ? `, separator="${payload.separator}"` : '')
						+`, output_col="${payload.newName}")`
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
              output_cols: columns.map(e=>newName(e))
            }
          },
          code: (payload) => {
            var _argument = (payload.columns.length==1) ? `"${payload.columns[0]}"` : `["${payload.columns.join('", "')}"]`
            var output_cols_argument =
              (!payload.output_cols.join('').trim().length) ? false :
              (payload.output_cols.length==1) ? `"${payload.output_cols[0]}"` :
              `[${payload.output_cols.map((e)=>((e!==null) ? `"${e}"` : 'None')).join(', ')}]`
            return `${this.dataset.varname} = ${this.dataset.varname}.cols.copy(`
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

            var output_cols_argument =
              (!payload.output_cols.join('').trim().length) ?
                false
              :
                (payload.output_cols.length==1) ?
                  `"${payload.output_cols[0]}"`
                :
                  `[${payload.output_cols.map((e)=>((e!==null) ? `"${e}"` : 'None')).join(', ')}]`

            return `${this.dataset.varname} = ${this.dataset.varname}.cols.bucketizer(`
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
            return `${this.dataset.varname} = ${this.dataset.varname}.cols.values_to_cols("${payload.columns[0]}")`
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

            var output_cols_argument =
              (!payload.output_cols.join('').trim().length) ?
                false
              :
                (payload.output_cols.length==1) ?
                  `"${payload.output_cols[0]}"`
                :
                  `[${payload.output_cols.map((e)=>((e!==null) ? `"${e}"` : 'None')).join(', ')}]`

            return `${this.dataset.varname} = ${this.dataset.varname}.cols.string_to_index(`
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

            var output_cols_argument =
              (!payload.output_cols.join('').trim().length) ?
                false
              :
                (payload.output_cols.length==1) ?
                  `"${payload.output_cols[0]}"`
                :
                  `[${payload.output_cols.map((e)=>((e!==null) ? `"${e}"` : 'None')).join(', ')}]`

            return `${this.dataset.varname} = ${this.dataset.varname}.cols.${payload.command}(`
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

            var output_cols_argument =
              (!payload.output_cols.join('').trim().length) ?
                false
              :
                (payload.output_cols.length==1) ?
                  `"${payload.output_cols[0]}"`
                :
                  `[${payload.output_cols.map((e)=>((e!==null) ? `"${e}"` : 'None')).join(', ')}]`

            return `${this.dataset.varname} = ${this.dataset.varname}.cols.impute(`
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
            return `${this.dataset.varname} = ${this.dataset.varname}.sample_n(${payload.n})`
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

    cells: {
      get() {
        return Array.from(this.$store.state.cells)
      },
      set(value) {
        this.$store.commit('cells', value)
      }
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
    // cells: {
    //   deep: true,
    //   handler (value) {
    //     this.store_cells = value
    //   }
    // },
    barHovered (value) {
      if (!value){
        this.moveBarDelayed(this.barTop)
      }
    },
    dataset: {
      deep: true,
      handler () {
        if (this._commandsDisabled===undefined){
          this._commandsDisabled = false
          this.markCells()
          this.codeError = ''
          this.lastWrongCode = false
        }
      }
    }
  },

  methods: {

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

    async commandHandle ( event ) {

			var payload = {}
			var columns = undefined

      if (!event.columns || !event.columns.length)
        columns = this.columns.map(e=>this.dataset.columns[e.index].name)
      else
        columns = event.columns

      var _command = this.commandsPallete[event.command] || this.commandsPallete[event.type]

      if (_command) {

        payload = _command.payload ? ( _command.payload(columns) ) : {}
        payload.type = event.type
        payload.command = event.command

        if (_command.dialog) {
          this.currentCommand = payload
          if (_command.onInit)
            await _command.onInit()
          setTimeout(() => {
            var ref = this.$refs['command-dialog'][0]
            if (ref && ref.$el){
              var el = ref.$el.getElementsByTagName('input')[0]
              if (el)
                el.focus()
            }
          }, 100);
        }
        else {
          var cell = {...event, columns: payload.columns || columns, payload}
          this.addCell(-1, cell)
          this.runButton = false
        }
      }
    },

    async confirmCommand () {
      var _command = this.commandsPallete[this.currentCommand.command] || this.commandsPallete[this.currentCommand.type]
      if (_command.onDone) {
        this.currentCommand = await _command.onDone(this.currentCommand)
      }
      else {
        this.addCell(-1, this.currentCommand )
        this.runButton = false
        this.currentCommand = false
      }
    },

    cancelCommand () {
			setTimeout(() => {
				this.currentCommand = false
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
      if (this.$refs.cells.$el){
        this.$refs.cells.$el.style.minHeight = value+27 + 'px'
      }

      if (this.$refs['cells-controls']) {
        this.$refs['cells-controls'].style.top = value + 'px'
      }
    },

    draggableEnd() {
      if (this.codeText().trim()===''){
        this.runButton = false
        this.codeError = ''
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
      this.codeError = ''

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

    addCell (at = -1, payload = {command: 'code', columns: []}) {

      this.codeError = ''

      var content = ''

      if (!payload.columns || !payload.columns.length) {
        payload.columns = this.columns.map(e=>this.dataset.columns[e.index].name)
      }

      if (!payload.content) {
        var _command = this.commandsPallete[payload.command] || this.commandsPallete[payload.type]
        if (_command) {
          content = _command.code ? _command.code(payload) : ''
        }
      }
      else {
        content = payload.content
      }

      if (at==-1)
        at = this.cells.length

      var cells = [...this.cells]

      cells.splice(at,0, {
        command: payload.command,
        content,
        id: Number(new Date()),
        active: false
      })

      this.cells = cells

      this.$nextTick(()=>{
        if (this.activeCell<0)
          this.setActiveCell(0)
        if (content.length)
          this.runCode()
      })

    },

    async evalCode (code) {
      var response = await this.socketPost('run', {
        code,
        session: this.$store.state.session
      }, {
        timeout: 0
      })

      return response
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
      else if ( !this.firstRun && (force || code.indexOf(codeDone)!=0 || codeDone=='' || this.lastWrongCode) ) {
        rerun = true
      }
      else {
        code = this.codeText(true)
      }

      if (code===this.lastWrongCode) {
        return;
      }

      if (rerun) {
				this.markCells(false)
      }

			if (this.firstRun){
				this.firstRun = false
				rerun = false
			}

      this._commandsDisabled = true;

      try {
        var response = await this.socketPost('cells', {
          code,
          name: this.dataset.summary ? this.dataset.name : null,
          session: this.$store.state.session
        }, {
          timeout: 0
        })

        this._commandsDisabled = false;

        if (response.status!='ok') {
          throw response
        }

        var content = JSON.parse(trimCharacters(response.content,"'")).data
        this.handleDatasetResponse(content)

        this.$forceUpdate()
        this.markCells()

        this.codeError = ''
        this.lastWrongCode = false

      } catch (error) {
        console.error(error)
        this.codeError = (error.content && error.content.ename) ? error.content.ename + ': ' + error.content.evalue : error
        this.markCellsError()
        this.lastWrongCode = code
        this._commandsDisabled = undefined;
      }

      if (this.codeText() !== code) {
        this.runCodeNow(false)
      }

    },

    runCode: debounce(async function(force = false){
      this.runCodeNow(force)
    },1000),
  }
}
</script>
