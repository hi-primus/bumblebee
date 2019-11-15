<template>
  <div>
		<template v-for="(command, key) in commandsPallete">
			<v-dialog
				:key="key"
				persistent
				v-if="command.dialog && currentCommand.command == key"
				:value="currentCommand.command == key"
				max-width="410"
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
						<v-card-text class="command-card-text pb-0 px-6">
							<div class="mb-2" v-if="command.dialog.text">
								{{
									(typeof command.dialog.text == 'function') ?
										command.dialog.text(currentCommand)
									:
										command.dialog.text
								}}
							</div>
							<template v-for="field in command.dialog.fields.filter(f=>(!f.condition || f.condition && f.condition(currentCommand)))">
								<template v-if="field.type=='field'">
									<v-text-field
										v-model="currentCommand[field.key]"
										:key="field.key"
										:label="(typeof field.label == 'function') ? field.label(currentCommand) : field.label"
										:placeholder="(typeof field.placeholder == 'function') ? field.placeholder(currentCommand) : field.placeholder"
                    :clearable="field.clearable"
										dense
										required
										outlined
									></v-text-field>
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
										dense
										required
										outlined
									></v-select>
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
								:disabled="!command.dialog.validate(currentCommand)"
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
        <transition-group type="transition" :name="!drag ? 'flip-list' : null">
          <div class="cell-container" v-for="(cell, index) in cells" :key="cell.id" :class="{'fixed-cell': cell.fixed, 'cell-error': cell.error,'done': cell.done,'active': cell.active}" @click="setActiveCell(index)">

            <div class="cell">
              <div class="handle left-handle"></div>
              <CodeEditor
                :active="cell.active"
                @update:active="setActiveCell(index)"
                @input="cell.content = $event; runButton = true"
                :value="cell.content"
              />
              <div class="cell-type cell-type-label" v-if="cell.command && cell.command!='code'">{{cell.command}}</div>
            </div>
          </div>
        </transition-group>
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
import { trimCharacters, debounce, newName } from '@/utils/functions.js'

const api_url = process.env.API_URL || 'http://localhost:5000'

export default {

  components: {
    CodeEditor,
    OutputColumnInputs
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
      cells: [],
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
            return `df = df.cols.keep(["${payload.columns.join('", "')}"])`
          }
        },
        BASE_DIALOG: {
          dialog: {
            fields: [
              {}
            ],
            output_cols: true,
            validate: (command) => true
          },
          payload: (columns) => ({
            command: 'BASE_DIALOG',
            columns: columns,
          }),
          code: (payload) => {

            // Multiple columns
            var _argument = (payload.columns.length==1) ? `"${payload.columns[0]}"` : `["${payload.columns.join('", "')}"]`

            // Multiple outputs n->n
            var output_cols_argument =
              (!payload.output_cols.join('').trim().length) ? false :
              (payload.output_cols.length==1) ? `"${payload.output_cols[0]}"` :
              `[${payload.output_cols.map((e)=>((e!==null) ? `"${e}"` : 'None')).join(', ')}]`


            return 'df = df.cols.BASE_DIALOG('
              +_argument
              // optional argument
              +( (payload.separator) ? `, separator="${payload.separator}"` : '')
              +( (output_cols_argument) ? `, output_cols=${output_cols_argument}` : '')
              +')'
          }
        },
        STRING: {
          code: (payload) => {
            var _argument = payload.columns.length==0 ? `"*"`
            : (payload.columns.length==1 ? `"${payload.columns[0]}"` : `input_cols=["${payload.columns.join('", "')}"]`)
            return `df = df.cols.${payload.command}(${_argument})`
          }
        },
        cast: {
          code: (payload) => {
            var _argument = (payload.columns.length==1) ? `"${payload.columns[0]}"` : `["${payload.columns.join('", "')}"]`
            return 'df = df.cols.cast('
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
            return 'df = df.cols.fill_na('
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
                  {text: 'CSV', value: 'csv'},
                  {text: 'XLS', value: 'xls'},
                  {text: 'JSON', value: 'json'},
                  {text: 'Avro', value: 'avro'},
                  {text: 'Parquet', value: 'parquet'}
                ]
              },
              {
                key: 'url',
                label: 'File url',
                placeholder: (c)=>`https://example.com/my_file.${c.type}`,
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
            let code = `df = op.load.${file.file_type}("${file.url}"`
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
              code +=`.limit(${file.limit})`
            }

            code += '.cache()'

            return code
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
df = db.table_to_df("${payload.table}").cache()`
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
              if (error.content.evalue && error.content.evalue.length<50)
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
          code: (payload) => (`df.save.${payload.format}("${payload.file_name}")`)
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
          code: (payload) => (`db.df_to_table(df, table="${payload.table_name}", mode="overwrite")`)
        },
        replace: {
          dialog: {
            text: (command) => {
              return `Replace from "${command.search}" to "${command.replace}"`
              + (command.columns.length==1 ? ` in ${command.columns[0]}` : '')
            },
            fields: [
              {
                type: 'field',
                key: 'search',
                label: 'Find'
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
						search: '', replace: '',
						search_by: 'chars',
            output_cols: columns.map(e=>newName(e)),
            title: 'Replace in ' + (columns.length==1 ? `column` : 'columns'),
					}),
          code: (payload) => {
            var _argument = (payload.columns.length==1) ? `"${payload.columns[0]}"` : `["${payload.columns.join('", "')}"]`
            var output_cols_argument =
              (!payload.output_cols.join('').trim().length) ? false :
              (payload.output_cols.length==1) ? `"${payload.output_cols[0]}"` :
              `[${payload.output_cols.map((e)=>((e!==null) ? `"${e}"` : 'None')).join(', ')}]`
            return 'df = df.cols.replace('
              +_argument
              +`, search="${payload.search}"`
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
            return `df = df.cols.set("${payload.newName}"`
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
              return `df = df.cols.rename("${payload.columns[0]}", "${payload.output_cols[0]}")`
            }
            else {
              return `df = df.cols.rename([${payload.columns.map((e,i)=>`("${e}", "${payload.output_cols[i]}")`)}])`
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
            return 'df = df.cols.unnest('
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
            return `df = df.cols.nest(["${payload.columns.join('", "')}"]`
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
            return 'df = df.cols.copy('
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
          code: (payload) => {
            return `df = df.cols.values_to_cols("${payload.columns[0]}")`
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

            return 'df = df.cols.string_to_index('
              + _argument
              + ( (output_cols_argument) ? `, output_cols=${output_cols_argument}` : '')
              + ')'
          },
        },
        z_score: {
          dialog: {
            title: 'Calculate Z-score',
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
          code: (payload) => {
            // cols.z_score(input_cols, output_cols=None)
            var _argument = (payload.columns.length==1) ? `"${payload.columns[0]}"` : `["${payload.columns.join('", "')}"]`

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

            return 'df = df.cols.impute('
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
            return 'df = df.sample_n('+ payload.n+')'
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
            return `dfs['${payload.new_df}'] = df.random_split(${payload.self}, weights=[${payload.weight1},${payload.weight2}], seed=${payload.seed})`
          }
        }
        */
      },

      barTop: 0,
      barHovered: false

    }
  },

  computed: {

    codeText () {
      return (this.cells.length) ? (this.cells.filter(e=>(e.content!=='')).map(e=>e.content).join('\n').trim()) : ''
    },

    codeNewText () {
      return (this.cells.length) ? (this.cells.filter(e=>(e.content!=='' && !e.done)).map(e=>e.content).join('\n').trim()) : ''
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
    commandHandle ( event ) {

			var payload = {}
			var columns = undefined

      if (!event.columns || !event.columns.length)
        columns = this.columns.map(e=>this.dataset.columns[e.index].name)
      else
        columns = event.columns

      var _command = this.commandsPallete[event.command] || this.commandsPallete[event.type]

      if (_command) {
        if (_command.dialog) {
          this.currentCommand = _command.payload ? _command.payload(columns) : {}
          this.currentCommand.type = event.type
          this.currentCommand.command = event.command
          setTimeout(() => {
            var ref = this.$refs['command-dialog'][0]
            if (ref && ref.$el){
              ref.$el.getElementsByTagName('input')[0].focus()
            }
          }, 100);
        }
        else {
          payload = _command.payload ? _command.payload(columns) : {}
          payload.type = event.type
          payload.command = event.command
          var cell = {...event, columns: payload.columns || columns, payload}
          this.addCell(-1, cell)
          this.runButton = false
        }
      }
    },

    async confirmCommand () {
      if (this.commandsPallete[this.currentCommand.command].onDone) {
        this.currentCommand = await this.commandsPallete[this.currentCommand.command].onDone(this.currentCommand)
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
      for (let i = 0; i < this.cells.length; i++) {
        this.cells[i].active = false
      }
      if (this.cells[index]) {
        this.cells[index].active = true
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
      if (this.codeText.trim()===''){
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

      if (index<0 || (['load file', 'load from database'].includes(this.cells[index].command) && this.cells.filter(e => ['load file', 'load from database'].includes(e.command) ).length<=1)) {
        return
      }

      this.codeError = ''

      this.cells.splice(index,1)
      if (this.cells.length==index) {
        index--
      }
      this.setActiveCell(index, true)

      this.draggableEnd()
    },

    markCells(mark = true) {
      for (let i = 0; i < this.cells.length; i++) {
        if (this.cells[i].content) {
          this.cells[i].done = mark
        }
        this.cells[i].error = false
      }

      if (mark && this.cells)
        this.codeDone = this.cells.map(e=>e.content).join('\n').trim()
      else
        this.codeDone = ''

    },

    markCellsError() {
      for (let i = 0; i < this.cells.length; i++) {
        if (!this.cells[i].done && this.cells[i].content)
          this.cells[i].error = true
      }

      if (this.cells)
        this.codeDone = this.cells.map(e=>e.content).join('\n').trim()
      else
        this.codeDone = ''
    },

    // setLoad (code) {
    //   this.addCell(-1,{ content: code, command: 'load file' })
    // },

    addCell (at = -1, payload = {command: 'code', columns: []}) {

      this.codeError = ''

      var content = ''

      if (!payload.columns || !payload.columns.length) {
        payload.columns = this.columns.map(e=>this.dataset.columns[e.index].name)
      }

      if (!payload.content) {

        switch (payload.command) {
          case 'drop':
            content = `df = df.cols.drop(["${payload.columns.join('", "')}"])`
            break;
          case 'keep':
            content = `df = df.cols.keep(["${payload.columns.join('", "')}"])`
            break;
          default:
            var _command = this.commandsPallete[payload.command] || this.commandsPallete[payload.type]
            if (_command) {
              content = _command.code ? _command.code(payload) : ''
            }
            break;
        }
      }
      else {
        content = payload.content
      }

      if (at==-1)
        at = this.cells.length

      this.cells.splice(at,0, {
        command: payload.command,
        content,
        id: Number(new Date()),
        active: false
      })

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

      var code = this.codeText
      var codeDone = this.codeDone.trim()
      var rerun = false

      if (code === codeDone){
        return;
      }
      else if ( !this.firstRun && (force || code.indexOf(codeDone)!=0 || codeDone=='' || this.lastWrongCode) ) {
        rerun = true
      }
      else {
        code = this.codeNewText
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

      if (this.codeText !== code) {
        this.runCodeNow(false)
      }

    },

    runCode: debounce(async function(force = false){
      this.runCodeNow(force)
    },1000),
  }
}
</script>
