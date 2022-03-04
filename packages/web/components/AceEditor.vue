<template>
  <div class="ace-editor-container" :height="cHeight" :style="{height}">
    <label for="editor" class="v-label theme--light pt-1">{{label}}</label>
    <div id="editor" :width="width" :height="cHeight" :style="{width, height: cHeight}"></div>
  </div>
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
    width: {
      default: '100%'
    },
    height: {
      default: '200px'
    },
    theme: {
      default: 'chrome'
    },
    lang: {
      type: String
    },
    options: {
      type: Object,
      default: () => {}
    },
  },

  data () {
    return {
      oldValue: '',
      editor: null,
    }
  },

  computed: {
    cHeight () {
      return typeof this.height === 'string' ? this.height : `${this.height}px`
    },
  },

  mounted () {
    try {
      if (process.client) {
        const ace = require("brace");
        window.ace = ace;

        let theme = this.theme || "chrome";

        let element = this.$el.querySelector("#editor");
        
        let editor = ace.edit(element, {
          mode: "ace/mode/" + (this.lang || "text"),
          selectionStyle: "text"
        });

        require(`brace/mode/${this.lang}`)
        editor.session.setMode(`ace/mode/${this.lang}`);
        
        if (this.value) {
          editor.setValue(this.value, 1);
        }
        this.oldValue = this.value;
        
        editor.setOptions(this.options || {});
        
        require(`brace/theme/${theme}`);
        editor.setTheme("ace/theme/" + theme);

        editor.on("change", () => {
          let content = editor.getValue();
          this.$emit("input", content);
          this.oldValue = content;
        });
        this.editor = editor;
      }
    } catch (err) {
      console.error(err);
    }
  },

  beforeDestroy: function () {
    try {
      this.editor.destroy();
      this.editor.container.remove();
    } catch (err) {
      console.error(err);
    }
  },

  watch: {
    value() {
      if (this.oldValue !== this.value) { 
        try {
          this.editor.setValue(this.value, 1); 
        } catch (err) {
          console.error(err);
        }
      }
    }
  }

}
</script>
