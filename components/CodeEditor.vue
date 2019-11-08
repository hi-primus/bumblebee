<template>
  <div id="editor" class="editor-holder">
    <div class="code-container">
        <!-- @blur="_active = false" -->
      <textarea
        @focus="_active = true"
        @blur="$emit('blur')"
        wrap="soft"
        ref="editor"
        auto-grow full-width hide-details no-resize
        v-model="query"
        class="editor" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
      ></textarea>
		  <pre><div ref="code" class="syntax-highlight py python code"></div></pre>
    </div>
  </div>
</template>

<script>
export default {

  props: {
    value: {
      type: String,
      default: ''
    },
    active: {
      type: Boolean,
      default: false
    }
  },

  watch: {
    query: {
      handler () {
        this.highlightSyntax()
        // this.$nextTick(()=>{
        //   if (this.$refs.editor && this.$refs.code) {
        //     this.$nextTick(()=>{
        //       this.$refs.editor.style.width = this.$refs.code.offsetWidth+'px'
        //     })
        //   }
        // })
      },
      immediate: true,
    }
  },

  mounted () {
    this.$nextTick(()=>{
      if (this.$refs.editor) {
        var nuxt = this;
        this.$refs.editor.onkeydown = function(e){
          if(e.keyCode==9 || e.which==9){
            if (e.shiftKey) {

            }
            else {
              e.preventDefault();
              var s = this.selectionStart;
              this.value = this.value.substring(0,this.selectionStart) + "\t" + this.value.substring(this.selectionEnd);
              this.selectionEnd = s+1;
              nuxt.query = this.value;
            }
          }
        }
      }
    })
  },

  methods: {
    highlightSyntax () {
      this.$nextTick(()=>{
        if (this.$refs.code) {
          this.$refs.code.innerHTML = this.escapedQuery+"&nbsp;";
          hljs.highlightBlock(this.$refs.code);
        }
      })
    }
  },

  computed: {
    escapedQuery(){
      return this.query
           .replace(/&/g, "&amp;")
           .replace(/</g, "&lt;")
           .replace(/>/g, "&gt;")
           .replace(/"/g, "&quot;")
           .replace(/'/g, "&#039;");
    },
    _active: {
      get () {
        return this.active
      },
      set (v) {
        this.$emit('update:active',v)
      }
    },
    query: {
      get () {
        return this.value
      },
      set (v) {
        this.$emit('input',v)
      }
    }
  },
}
</script>
