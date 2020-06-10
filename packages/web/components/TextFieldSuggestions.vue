<template>
  <span :id="'tfs'" style="position: relative;">
    <v-menu
      bottom
      :value="resultsSuggestions && resultsSuggestions.length && !forceClose"
      :disabled="!(resultsSuggestions && resultsSuggestions.length && !forceClose)"
      nudge-bottom="34px"
      min-width="270px"
      max-height="280px"
    >
      <template v-slot:activator="{ on }">
        <v-text-field
          :value="value"
          :label="label"
          :placeholder="placeholder"
          :clearable="clearable"
          :class="{'mono-field': mono}"
          ref="inputField"
          v-on="on"
          @input="$emit('input',$event)"
          @keydown.escape="escapePressed"
          @keydown.ctrl.space="ctrlSpacePressed"
          @keydown.down="downPressed"
          @keydown.enter="enterPressed"
          spellcheck="false"
          dense
          required
          outlined
        ></v-text-field>
      </template>
      <v-list
        dense
        class="code-suggestions"
        ref="suggestionsMenu"
        @keydown.escape="escapePressed"
      >
        <v-list-item
          v-for="(suggestion, index) in resultsSuggestions"
          :key="index"
          @keydown.up="(index===0) ? focusField : ()=>{}"
          @click="useSuggestion(suggestion)"
        >
          <v-list-item-title :title="suggestion.description">
            {{suggestion.text}}
            <span class="suggestion-description">
              <template v-if="'unary_operators'===suggestion.type">
                Unary operator
              </template>
              <template v-else-if="'binary_operators'===suggestion.type">
                Binary operator
              </template>
              <template v-else-if="'columns'===suggestion.type">
                Column
              </template>
              <template v-else-if="'functions'===suggestion.type">
                Function
              </template>
            </span>
          </v-list-item-title>
          <v-list-item-icon v-if="['columns','functions'].includes(suggestion.type)">
            <v-icon>
              <template v-if="suggestion.type==='columns'">mdi-table-column</template>
              <template v-else-if="suggestion.type==='functions'">mdi-function</template>
            </v-icon>
          </v-list-item-icon>
        </v-list-item>
      </v-list>
    </v-menu>
  </span>
</template>

<script>

import { debounce, throttle } from '@/utils/functions.js'

export default {
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
      caretWord: '',
      caretWordPosition: -1,
      resultsSuggestions: false,
      forceClose: false
    }
  },

  computed: {
    selectionStart () {
      try {
        return this.$refs.inputField.getElementsByTagName('input')[0].selectionStart()
      } catch (err) {
        console.error(err)
      }
    },
  },

  mounted () {
    this.$nextTick(()=>{
      // const textarea = this.$refs.inputField.$el.getElementsByTagName('input')[0]
      // textarea.addEventListener('keydown', this.keyDown)
    })
  },

  beforeDestroy () {
    try {
      // const textarea = this.$refs.inputField.$el.getElementsByTagName('input')[0]
      // textarea.removeEventListener('keydown', this.keyDown)
    } catch (err) {
      console.error(err)
    }
  },

  methods: {

    escapePressed (event) {
      if (!this.forceClose) {
        this.forceClose = true
        event.stopPropagation()
      }
    },

    enterPressed (event) {
      this.$nextTick(()=>{
        if (this.resultsSuggestions && this.resultsSuggestions[0] && !this.avoidPropagation) {
          this.useSuggestion(this.resultsSuggestions[0])
          event.stopPropagation()
        }
      })
    },

    downPressed (event) {
      this.forceClose = false
      this.checkCaret(undefined, true)
    },

    ctrlSpacePressed (event) {
      this.forceClose = false
      this.checkCaret(undefined, true)
    },

    focusList () {
      this.$refs.suggestionsMenu.$el.getElementsByClassName('v-list-item')[0].focus()
    },
    focusField () {
      this.$refs.inputField.$el.focus()
    },

    getWordAt (str, pos) {

      str = String(str)
      pos = Number(pos) >>> 0

      pos = pos || 1

      var left = str.slice(0, pos).search(/[^\s\(\)]+$/)
      if (left<0)
          return ['', -1]
      var right = str.slice(pos - 1).search(/[\s\(\)]/)
      right = Math.max(right,1)

      return [str.slice(left, pos+right-1).trim(), left]
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

    useSuggestion (newWord = {text: ''}, avoidPropagation = true) {

      if (this.caretWord === '' || this.caretWordPosition < 0 || newWord === '') {
        return
      }

      this.avoidPropagation = true

      var inP = (this.value[this.caretPos] === ')')

      // TODO: Unary operators handling (must ignore them on suggestionSearch when length>1 and startsWith(uo))

      var value = this.value.substring(0, this.caretWordPosition)
        + newWord.text
        + (newWord.type==='functions' ? '() ' : (( /*newWord.type==='unary_operators' ||*/ inP) ? '' : ' '))
        + this.value.substring(this.caretWordPosition + this.caretWord.length, this.value.length)

      var caretPos

      caretPos = this.caretWordPosition + newWord.text.length + 1/*+ (newWord.type!=='unary_operators' ? 1 : 0)*/ + (inP ? 1 : 0)

      // this.value = value
      this.$emit('input',value)

      this.$nextTick(()=>{
        this.avoidPropagation = false
        this.setCaretPosition(caretPos)
        this.checkCaret(undefined, true)
      })
    },

    checkCaret (event, forceCheck = false) {
      this.forceClose = false
      const textarea = this.$refs.inputField.$el.getElementsByTagName('input')[0]
      const newPos = textarea.selectionStart
      if (newPos !== this.caretPos) {
        this.caretPos = newPos
        this.getCaretWord(this.caretPos, forceCheck)
        this.searchSuggestions()
      }
    },

    getCaretWord (pos, forceCheck = false) {
      const expressionRegex = /^[\dA-Za-z\/\+\-\~\*\|\&]+$/
      if (pos>0 && (!this.value[pos] || (!this.value[pos].match(expressionRegex) || forceCheck)  ) && (this.value[pos-1] && this.value[pos-1].match(expressionRegex))) {
        var [caretWord, caretWordPosition] = this.getWordAt (this.value, pos)
        this.caretWord = caretWord
        this.caretWordPosition = caretWordPosition
      } else if (this.caretWord !== '') {
        this.caretWord = ''
      }
    },

    searchSuggestions: throttle( async function() {
      if (this.caretWord) {
        var suggestions = this.suggestions.map((text)=>{
          if (text.includes(' ')) {
            text = `{${text}}`
          }
          return {type: 'columns', text, description: ''}
        })
        suggestions = [...suggestions, ...this.$store.state.reservedWords]
        this.resultsSuggestions = await this.$search(this.caretWord, suggestions, {
          shouldSort: true,
          threshold: 0.1,
          keys: ['text']
        })
      } else {
        this.resultsSuggestions = false
      }
    }, 80 )
  },

  watch: {
    value (value) {
      this.$nextTick(()=>{
        this.checkCaret()
      })
    }
  }

}
</script>
