<template>
  <span
    :id="'tfs'"
    style="position: relative;"
  >
    <v-menu
      bottom
      :value="(suggestionsVisible || functionInfo) && !hideMenu"
      :disabled="!((suggestionsVisible || functionInfo) && !hideMenu)"
      nudge-bottom="34px"
      min-width="270px"
      max-height="340px"
      :close-on-content-click="false"
      :close-on-click="false"
    >
      <template v-slot:activator="{ on }">
        <!-- @blur="blurField" -->
        <v-text-field
          :value="value"
          :label="label"
          :placeholder="placeholder"
          :clearable="clearable"
          :class="{'mono-field': mono}"
          ref="inputField"
          v-on="on"
          @input="$emit('input',$event)"
          @focus="hideMenu = false; hideSuggestions = false"
          @click="hideMenu = false; hideSuggestions = false"
          @keydown="keyPressed"
          spellcheck="false"
          autocomplete="off"
          dense
          required
          outlined
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
          @keydown.up="(index===0) ? focusField : ()=>{}"
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
              <template v-else-if="'function'===suggestion.type">
                Function
              </template>
            </span>
          </v-list-item-title>
          <v-list-item-icon v-if="['column','function'].includes(suggestion.type)">
            <v-icon>
              <template v-if="suggestion.type==='column'">mdi-table-column</template>
              <template v-else-if="suggestion.type==='function'">mdi-function</template>
            </v-icon>
          </v-list-item-icon>
        </v-list-item>
      </v-list>
    </v-menu>
  </span>
</template>

<script>

/*bu*/ import { debounce, throttle } from 'bumblebee-utils' /*bu*/
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
      type: Array,
      default: ()=>[]
    }
  },

  data () {
    return {
      avoidPropagation: false,
      caretPos: 0,
      activeWord: '',
      activeWordPosition: 0,
      resultsSuggestions: false,
      hideMenu: false,
      hideSuggestions: false,
      context: {},
      functionShow: true,
    }
  },

  computed: {

    suggestionsVisible () {
      return this.resultsSuggestions && this.resultsSuggestions.length && !this.hideSuggestions
    },

    functionInfo () {
      if (!this.context || !this.context.inFunction) {
        return false;
      }
      if (this.context.activeCompleteWord !== this.context.inFunction.value) {
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
      var suggestions = this.suggestions.map((text)=>{
        var menuText = text
        if (text.includes(' ')) {
          text = `{${text}}`
        }
        return {type: 'column', text, menuText, description: ''}
      })
      return [...(suggestions || []), ...(this.$store.state.globalSuggestions || [])]
    },

    selectionStart () {
      try {
        return this.$refs.inputField.getElementsByTagName('input')[0].selectionStart()
      } catch (err) {
        console.error(err)
      }
    },
  },

  methods: {

    blurField () {
      this.$nextTick(()=>{
        this.hideMenu = true;
      })
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
        this.debouncedCheckCaret()
      }

    },

    escapePressed () {
      if (!this.hideMenu) {
        this.hideMenu = true
      }
    },

    enterPressed (event) {
      if (!this.functionInfo && (!this.resultsSuggestions || !this.resultsSuggestions.length)) {

        return true

      } else if (this.hideMenu) {

        this.hideMenu = false
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
      this.hideMenu = false
      this.hideSuggestions = false
      this.debouncedCheckCaret()
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
      if (this.activeWord.length) {
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
        this.hideMenu = false
        this.hideSuggestions = false
        this.checkCaret(true)
        if (this.context && !this.context.inFunction && this.context.activeCompleteWord===this.context.activeWord) {
          this.hideSuggestions = true
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
      // this.hideMenu = false
      const textarea = this.$refs.inputField.$el.getElementsByTagName('input')[0]
      const newPos = textarea.selectionStart
      if (force || (newPos !== this.caretPos)) {
        this.caretPos = newPos
        this.context = this.getContext(this.value,this.caretPos)
      }
    },

    searchSuggestions: throttle( async function(parameterTypes) {
      if (this.activeWord) {
        this.resultsSuggestions = await this.$search(this.activeWord, this.allSuggestions, {
          shouldSort: true,
          threshold: 0.1,
          keys: ['text']
        })
      } else if (parameterTypes) {
        this.resultsSuggestions = this.allSuggestions.filter(sugg => parameterTypes.includes(sugg.type))
      } else {
        this.resultsSuggestions = false
      }
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
        this.searchSuggestions(types)
      }

    },
    value (value) {
      this.$nextTick(()=>{
        this.debouncedCheckCaret(true)
      })
    }
  }

}
</script>
