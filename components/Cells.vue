<template>
  <div>
    <template name="command-dialogs">
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
							:disabled="currentCommand.index>=currentCommand.splits || currentCommand.separator==''"
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
            <!-- <v-select
              v-model="currentCommand.shape"
              label="Shape"
              dense
              required
              outlined
              :items="[
                {text: 'None', value: ''},
                {text: 'String', value: 'string'},
                {text: 'Array', value: 'array'},
                {text: 'Vector', value: 'vector'}
              ]"
            ></v-select> -->
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
							:max="currentCommand.splits-1"
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
							:disabled="currentCommand.index>=currentCommand.splits || currentCommand.separator==''"
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
import CodeEditor from '@/components/CodeEditor'
import OutputColumnInputs from '@/components/OutputColumnInputs'
import { throttle, newName } from '@/utils/functions.js'

const api_url = process.env.API_URL || 'http://localhost:5000'

export default {

  components: {
    CodeEditor,
    OutputColumnInputs
  },

  props: {
    columns: {
      type: Array,
      default: ()=>{return[]}
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
      lastCodeTry: false,
      drag: false,
      currentCommand: false,
      codeError: ''
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
        this.runCode
        if (!this.cells.length)
          this.codeError = ''
      }
    }
  },

  methods: {
    commandHandle ( event ) {

      var payload = undefined

      if (!event.columns || !event.columns.length)
        event.columns = this.columns.map(e=>this.dataset.columns[e.index].name)

      switch (event.command) {
        case 'rename':
          this.currentCommand = {
            command: 'rename',
            columns: event.columns,
            name: (event.columns.length==1) ? `"${event.columns[0]}"` : 'columns',
            renames: event.columns.map((e)=>{
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
            columns: event.columns,
            name: (event.columns.length==1) ? `"${event.columns[0]}"` : 'columns',
            output_cols: event.columns.map(e=>newName(e))
          }
          break;
        case 'unnest':
          this.currentCommand = {
						command: 'unnest',
						columns: event.columns,
						// shape: 'string',
						separator: ', ',
						splits: 2,
						index: '',
						output_cols: event.columns.map(e=>'')
					}
          break;
        case 'replace':
          this.currentCommand = {
						command: 'replace',
						columns: event.columns,
						search: '', replace: '',
						search_by: 'chars',
						output_cols: event.columns.map(e=>'')
					}
          break;
        case 'fill':
          this.currentCommand = {
            command: 'fill',
            columns: event.columns,
            fill: '',
            output_cols: event.columns.map(e=>'')
          }
          break;
        default:
        case 'drop':
        case 'keep':
        case 'nest':
          payload = undefined
          this.addCell(-1, event.command, event.columns, payload )
          break;
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

    addCell (at = -1,type = 'code', columns = [], payload) {

      var content = ''

      if (!columns.length)
        columns = this.columns.map(e=>this.dataset.columns[e.index].name)

      switch (type) {
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
          content = `df = df.cols.nest(["${columns.join('", "')}"])`
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
          content = `df = df.cols.fill_na(${_argument}, "${payload.fill}")`
          content = 'df = df.cols.fill_na('
						+_argument
						+`, "${payload.fill}"`
						+( (output_cols_argument) ? `, output_cols=${output_cols_argument}` : '')
						+')'
          break;
        default:

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

    runCode: throttle(async function() {

      var code = this.cells.map(e=>(e.content!=='') ? e.content+'\n' : '').join('').trim()
      var codeDone = this.codeDone.trim()
      var rerun

      if (code == codeDone){
        return;
      }
      else if (code.indexOf(codeDone)!=0 || codeDone=='') {
        rerun = true
      }
      else {
        code = this.cells.filter(e=>!e.done).map(e=>e.content).join('\n')
      }

      if (code===this.lastCodeTry) {
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
          this.lastCodeTry = false
        }
        else {
          this.codeError = response.data.error.ename + ': ' + response.data.error.evalue
          this.markCellsError()
          this.lastCodeTry = code
        }
      } catch (error) {
        console.error(error)
      }

    },1000),


  }
}
</script>
