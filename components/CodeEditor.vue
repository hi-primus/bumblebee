<template>
  <div id="editor" class="editor-holder">
    <textarea
      ref="editor"
      auto-grow full-width hide-details no-resize
      v-model="query"
      class="editor" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
    ></textarea>
		<pre><div ref="code" class="syntax-highlight py python code"></div></pre>
  </div>
</template>

<script>
export default {

  props: {
    value: {
      type: String,
      default: ''
    }
  },

  watch: {
    query: {
      handler: 'highlightSyntax',
      immediate: true,
    }
  },

  mounted () {
    this.$nextTick(()=>{
      if (this.$refs.editor) {
        console.log(this.$refs.editor)
        this.$refs.editor.onkeydown = function(e){
          if(e.keyCode==9 || e.which==9){
            e.preventDefault();
              var s = this.selectionStart;
              this.value = this.value.substring(0,this.selectionStart) + "\t" + this.value.substring(this.selectionEnd);
              this.selectionEnd = s+1;
          }
        }
      }
    })
  },

  methods: {
    highlightSyntax () {
      this.$nextTick(()=>{
        if (this.$refs.code) {
          console.log(this.$refs.code)
          this.$refs.code.innerHTML = this.escapedQuery;
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

<style lang="scss">
  .editor-holder{
    position: relative;
    top: 0;
    overflow: auto;
    padding: 12px;
    border: 2px solid lightgray;
    border-radius: 4px;
    background-color: #F0F0F0;

    max-width: 365px;
    min-height: 135px;

    * {
      padding: 0 !important;
      margin: 0 !important;
      transition: none !important;
    }

    textarea, .code {
      font-size: 14px !important;
      font-family: "Ubuntu Mono" !important;
      line-height: 21px !important;
      overflow: visible;
      letter-spacing: initial !important;

      transition: all 0.5s ease-in-out;
    }

    textarea {
      background: transparent !important;
      position: absolute;
      top: 12px;
      left: 12px;
      height: calc(100% - 12px);
      width: calc(100% - 12px);
      background-color: rgba(green,0.25);
      // width: 1000vw;
    }

    .v-textarea{
      background: transparent !important;
      z-index: 2;
      height: auto;
      resize: none;
      color: #000;
      text-shadow: 0px 0px 0px rgba(0, 0, 0, 0);
      width: 780px;
      text-fill-color: transparent;
      -webkit-text-fill-color: transparent;

      &::-webkit-input-placeholder{
        color: black;
      }

      &:focus{
        outline: 0;
        border: 0;
        -webkit-box-shadow: none;
        -moz-box-shadow: none;
        box-shadow: none;
      }
      textarea {
        white-space: nowrap;
        overflow: show;
        background-color: rgba(blue,0.25);
        width: 780px;
      }
    }

    pre {
      // position: absolute;
      // top: 12px;
      // left: 12px;
      background-color: rgba(red,0.12);
    }
    .code{
      z-index: 1;
      background-color: rgba(red,0.13);
      pointer-events: none;
      white-space: nowrap;
    }
  }
</style>
