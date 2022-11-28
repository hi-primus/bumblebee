import { editor, languages } from 'monaco-editor/esm/vs/editor/editor.api';

export default defineNuxtPlugin(nuxtApp => {
  return {
    provide: {
      monaco: { editor, languages }
    }
  };
});
