import type { editor, languages } from 'monaco-editor';

export default function () {
  const nuxtApp = useNuxtApp();
  return nuxtApp.$monaco as {
    editor: typeof editor;
    languages: typeof languages;
  };
}
