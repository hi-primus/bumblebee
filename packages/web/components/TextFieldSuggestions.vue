<template>
  <span
    ref="tfs"
    style="position: relative;"
  >
      <!-- :attach="$refs.tfs" -->
    <v-menu
      bottom
      v-model="menuVisible"
      nudge-bottom="34px"
      min-width="270px"
      max-height="340px"
      ref="tfs-menu"
      :close-on-content-click="false"
      :close-on-click="true"
    >
      <template v-slot:activator="{ on }">
        <v-text-field
          :value="value"
          :label="label"
          :placeholder="placeholder"
          :clearable="clearable"
          :class="{'mono-field': mono}"
          ref="inputField"
          @input="$emit('input',$event)"
          @click="onClickField(true)"
          @focus="onClickField(false)"
          @keydown="keyPressed"
          spellcheck="false"
          autocomplete="off"
          dense
          required
          outlined
          v-on="on"
        ></v-text-field>
      </template>
      <div
        v-if="functionInfo"
        class="function-helper"
      >
        <div class="d-flex justify-space-between mb-2">
          <div class="font-mono function-hint" v-html="functionInfo.highlight"></div>
          <v-icon v-show="false" class="flippable" :class="{'flipped': functionShow}" @click="functionShow = !functionShow" color="black">expand_more</v-icon>
        </div>
        <template v-if="functionShow">
          <div class="function-description text-caption">
            {{functionInfo.description}}
          </div>
          <div class="function-h">
            Example
          </div>
          <div class="function-example font-mono pb-2">
            {{functionInfo.example}}
          </div>
          <div class="divider"></div>
          <div class="function-parameters py-2">
            <div class="function-parameter" v-for="(param, index) in functionInfo.params" :key="index">
              <span
                class="font-mono function-parameter-name"
                :class="{'function-parameter-highlight': functionInfo.activeParameter === index}"
              >
                {{param.name}}:
              </span>
              <span class="text-caption">
                {{param.description}}
              </span>
            </div>
          </div>
          <div v-show="suggestionsVisible" class="divider"></div>
        </template>
        <div v-show="suggestionsVisible" class="function-h pt-4 mb--2">
          Suggestions
        </div>
      </div>
      <v-list
        dense
        class="code-suggestions"
        ref="suggestionsMenu"
        @keydown.escape="escapePressed"
        v-if="suggestionsVisible"
      >
        <v-list-item
          v-for="(suggestion, index) in resultsSuggestions"
          :key="index"
          @click="useSuggestion(suggestion)"
        >
          <v-list-item-title :title="suggestion.description">
            {{suggestion.menuText || suggestion.text}}
            <span class="suggestion-description">
              <template v-if="'unary_operator'===suggestion.type">
                Unary operator
              </template>
              <template v-else-if="'binary_operator'===suggestion.type">
                Binary operator
              </template>
              <template v-else-if="'column'===suggestion.type">
                Column
              </template>
              <template v-else-if="'dateformat'===suggestion.type">
                Date format
              </template>
              <template v-else-if="'function'===suggestion.type">
                Function
              </template>
            </span>
          </v-list-item-title>
          <v-list-item-icon v-if="['column','function', 'dateformat'].includes(suggestion.type)">
            <v-icon>
              <template v-if="suggestion.type==='column'">mdi-table-column</template>
              <template v-else-if="suggestion.type==='dateformat'">calendar_today</template>
              <template v-else-if="suggestion.type==='function'">mdi-function</template>
            </v-icon>
          </v-list-item-icon>
        </v-list-item>
      </v-list>
    </v-menu>
  </span>
</template>

<script>

import { debounce, throttle } from 'bumblebee-utils'
import autocompleteMixin from '@/plugins/mixins/autocomplete.js'

export default {

  mixins: [ autocompleteMixin ],

  props: {
    value: {
      type: String
    },
    label: {
      type: String
    },
    placeholder: {
      type: String
    },
    clearable: {
      type: Boolean
    },
    mono: {
      type: Boolean
    },
    suggestions: {
      type: Object,
      default: ()=>({})
    },
    suggestOnEmpty: {
      type: String,
      default: ''
    },
    useFunctions: {
      type: Boolean
    },
    fuzzySearch: {
      type: Boolean
    },
  },

  data () {
    return {
      avoidPropagation: false,
      caretPos: 0,
      activeWord: '',
      activeWordPosition: 0,
      resultsSuggestions: false,
      showMenu: false,
      hideSuggestions: false,
      context: {},
      functionShow: true,
    }
  },

  computed: {

    menuVisible: {
      get () {
        return (this.suggestionsVisible || this.functionInfo) && this.showMenu
      },
      set (v) {
        setTimeout(() => {
          this.showMenu = !!v;
        }, 100);
      }
    },

    suggestionsVisible () {
      return this.resultsSuggestions && this.resultsSuggestions.length && !this.hideSuggestions
    },

    functionInfo () {
      if (!this.context || !this.context.inFunction) {
        return false;
      }
      if (this.context.activeCompleteWord !== this.context.inFunction.value && this.useFunctions) {
        var functionName = this.context.inFunction.value;
        var info = this.getFunctionInfo(functionName);
        if (!info) {
          return false
        }
        var params = info.params
        var highlight = functionName + '(';
        var currentParam = this.context.inFunction.inParameter
        for (let i = 0; i < params.length; i++) {
          const param = params[i];
          if (i===currentParam) {
            highlight += `<span class="function-parameter-highlight">${param.name}</span>`;
          } else {
            highlight += param.name;
          }

          if (i!==params.length-1) {
            highlight += ', ';
          }
        }
        highlight += ')'
        return {
          ...info,
          activeParameter: this.context.inFunction.inParameter,
          highlight,
          // parameterName: params[currentParam].name,
          // parameterDescription: params[currentParam].description
        };
      }
      return false;
    },

    allSuggestions () {

      var suggestions = []

      Object.entries(this.suggestions).forEach(([key, arr])=>{
        if (!arr || !arr.length) {
          return
        }
        var sugg = arr.map((text)=>{
          var menuText = text
          if (text.includes(' ')) {
            text = `{${text}}`
          }
          return {type: key, text, menuText, description: ''}
        })
        suggestions = [ ...suggestions, ...sugg ]
      })

      if (this.useFunctions) {
        suggestions = [ ...suggestions, ...(this.$store.state.functionsSuggestions || []) ]
      }

      return suggestions
    },

    selectionStart () {
      try {
        return this.$refs.inputField.$el.getElementsByTagName('input')[0].selectionStart()
      } catch (err) {
        console.error(err)
      }
    },
  },


  mounted () {
    if (this.suggestOnEmpty) {
      this.searchSuggestions(false);
    }
  },

  methods: {

    blurField () {
      this.$nextTick(()=>{
        this.showMenu = false;
      })
    },

    async onClickField (isClick) {
      if (!this.value) {
        this.activeWord = ''
        await this.searchSuggestions(false);
      }
      if (this.menuVisible && isClick) {
        this.showMenu = false;
      }
      else if (!this.menuVisible) {
        setTimeout(() => {
          this.showMenu = true;
          this.hideSuggestions = false;
        }, 150);
      }
    },

    async onBlurField () {
      this.showMenu = false;
    },

    keyPressed (event) {
      if (event.keyCode===27) {
        this.escapePressed()
        event.stopPropagation()
      } else if (event.keyCode===13) {
        if (!this.enterPressed(event)) {
          return false
        }
      } else if (event.keyCode===40) {
        this.makeVisible()
      } else if (event.keyCode===32 && event.ctrlKey) {
        this.makeVisible()
      } else {
        this.debouncedCheckCaret(true)
      }

    },

    escapePressed () {
      if (this.showMenu) {
        this.showMenu = false
      }
    },

    enterPressed (event) {
      if (!this.functionInfo && (!this.resultsSuggestions || !this.resultsSuggestions.length)) {

        return true

      } else if (!this.showMenu) {

        this.showMenu = true
        this.hideSuggestions = false

      } else if (!this.avoidPropagation) {

        this.$nextTick(()=>{
          if (this.suggestionsVisible) {
            this.useSuggestion(this.resultsSuggestions[0])
          } else if (this.functionInfo) {
            if (this.functionInfo.activeParameter == this.functionInfo.params.length-1) {
              this.addAtCaretPos(') ')
            } else {
              this.addAtCaretPos(', ')
            }
          }
        })

      }

      event.stopPropagation()
      event.preventDefault()
      return false
    },

    makeVisible () {
      this.showMenu = true
      this.hideSuggestions = false
      this.debouncedCheckCaret(true)
    },

    focusList () {
      this.$refs.suggestionsMenu.$el.getElementsByClassName('v-list-item')[0].focus()
    },
    focusField () {
      this.$refs.inputField.$el.focus()
    },

    setCaretPosition(caretPos) {
      const textarea = this.$refs.inputField.$el.getElementsByTagName('input')[0]

      if (textarea != null) {
        if (textarea.createTextRange) {
          var range = textarea.createTextRange();
          range.move('character', caretPos);
          range.select();
        }
        else {
          if (textarea.selectionStart) {
            textarea.focus();
            textarea.setSelectionRange(caretPos, caretPos);
          } else {
            textarea.focus();
          }
        }
      }
    },

    addAtCaretPos (string) {
      var at = this.caretPos
      var value = [
        this.value.substring(0, at),
        string,
        this.value.substring(at, this.value.length)
      ].join('')
      var caretPos = this.caretPos + string.length
      this.$emit('input',value)
      this.$nextTick(()=>{
        this.avoidPropagation = false
        this.setCaretPosition(caretPos)
      })
    },

    useSuggestion (newWord = {text: ''}) {

      if (!newWord && !newWord.text) {
        return
      }

      var splittedString

      this.activeWordPosition = this.activeWordPosition || 0

      if (this.activeWord && this.activeWord.length) {
        splittedString = [
          this.value.substring(0, this.activeWordPosition),
          this.value.substring(this.activeWordPosition + this.activeWord.length, this.value.length)
        ]
      } else {
        splittedString = [
          this.value.substring(0, this.activeWordPosition+1),
          this.value.substring(this.activeWordPosition+1, this.value.length)
        ]
      }

      this.avoidPropagation = true

      var inP = (this.value[this.caretPos] === ')')

      var newWordText = newWord.text

      // gets , or ) depending on parameter
      if (this.context && this.context.inFunction) {
        var param = this.getParameter(this.context.inFunction.value, this.context.inFunction.inParameter+1)
        if (param) {
          newWordText += ','
        } else {
          newWordText += ')'
        }
      }

      var value = splittedString[0]
        + newWordText
        + (newWord.type==='function' ? '(' : ' ')
        + splittedString[1]

      var caretPos = this.activeWordPosition + newWordText.length + 1

      this.$emit('input',value)

      this.$nextTick(()=>{
        this.avoidPropagation = false
        this.setCaretPosition(caretPos)
        this.showMenu = true
        this.hideSuggestions = false
        this.checkCaret(true)
        if (this.context && !this.context.inFunction && this.context.activeCompleteWord===this.context.activeWord) {
          this.$nextTick(()=>{
            this.hideSuggestions = true
          })
        }
      })
    },

    getParameter (functionName, parameterNumber) {
      try {
        var suggestion = this.allSuggestions.find(sugg=>sugg.text===functionName)
        if (suggestion) {
          return suggestion.params[parameterNumber]
        }
      } catch (err) {
        return undefined
      }
    },
    getFunctionInfo (functionName) {
      try {
        var suggestion = this.allSuggestions.find(sugg=>sugg.text===functionName)
        if (suggestion) {
          return suggestion
        }
      } catch (err) {
        return []
      }
    },


    debouncedCheckCaret: debounce( function (force) {
      this.checkCaret(force)
    }, 100),

    checkCaret (force = false) {
      const textarea = this.$refs.inputField.$el.getElementsByTagName('input')[0]
      const newPos = textarea.selectionStart
      if (force || (newPos !== this.caretPos)) {
        this.caretPos = newPos
        try {
          var newContext = this.getContext(this.value,this.caretPos)
          this.context = newContext
        } catch (err) {
          console.warn(err)
        }
      }
    },

    async searchSuggestions (parameterTypes) {
      if (this.activeWord) {
        if (this.fuzzySearch) {
          this.resultsSuggestions = await this.$search(this.activeWord, this.allSuggestions, {
            shouldSort: true,
            threshold: 0.1,
            keys: ['text']
          })
        } else {
          this.resultsSuggestions = this.allSuggestions.filter(sugg => sugg.text.startsWith(this.activeWord))
        }
      } else if (parameterTypes) {
        this.resultsSuggestions = this.allSuggestions.filter(sugg => parameterTypes.includes(sugg.type))
      } else if (this.suggestOnEmpty) {
        this.resultsSuggestions = this.allSuggestions.filter(sugg => sugg.type === this.suggestOnEmpty)
      } else {
        this.resultsSuggestions = false
      }
    },

    searchSuggestionsThrottled: throttle( async function(parameterTypes) {
      await this.searchSuggestions(parameterTypes)
    }, 80 )
  },

  watch: {

    functionInfo () {
      this.functionShow = true
    },

    context: {
      deep: true,
      handler (context) {
        if (context.activeWord && context.activeCompleteWord && context.activeWord.length < context.activeCompleteWord.length) {
          this.resultsSuggestions = false
          return
        }
        const activeWord = context.activeWord
        if (!['(',')',','].includes(activeWord)) {
          this.activeWord = activeWord
        } else {
          this.activeWord = ''
        }
        this.activeWordPosition = context.activeWordPosition
        let types
        if (!this.activeWord && context.inFunction) {
          let param = this.getParameter(context.inFunction.value, context.inFunction.inParameter)
          types = param ? (param.types || param.type) : [] // TO-DO: get param.types
          if (!Array.isArray(types)) {
            types = [types]
          }
        }
        this.searchSuggestionsThrottled(types)
      }

    },

    menuVisible (value, previousValue) {
      setTimeout(() => {
        if (this.$refs['tfs-menu'].listIndex<0) {
          this.$refs['tfs-menu'].getTiles();
          this.$refs['tfs-menu'].nextTile();
        }
      }, 50);
    },

    value (value) {
      setTimeout(() => {
        if (this.$refs['tfs-menu'].listIndex<0) {
          this.$refs['tfs-menu'].getTiles();
          this.$refs['tfs-menu'].nextTile();
        }
      }, 50);
      this.$nextTick(()=>{
        this.makeVisible()
      })
    }
  }

}
</script>
