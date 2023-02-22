<template>
  <NuxtLayout>
    <div
      class="playground-container h-[100vh] p-5 flex gap-3 text-text"
      :class="{
        'opacity-50 pointer-events-none': !enabled
      }"
    >
      <div class="w-2/3">
        <div class="h-12 flex mb-4">
          <button
            type="button"
            @click="runCode"
            class="bg-primary hover:bg-primary-darker text-white rounded px-4 py-2"
          >
            {{ enabled ? 'Run' : 'Loading...' }}
          </button>
          <div class="hints h-full py-2 px-6">
            Client variable name:
            <span class="font-mono text-primary-darkest">blurr</span>
          </div>
        </div>
        <!-- a text area that when i press shift enter alerts its content -->

        <div
          @keydown.enter="
            e => {
              e.shiftKey && runCode();
              e.shiftKey && e.preventDefault();
              e.shiftKey && e.stopPropagation();
            }
          "
          ref="container"
          class="font-mono text-text-alpha rounded overflow-hidden h-[calc(100%-64px)] w-full"
        >
          <!-- v-model="code" -->
        </div>
      </div>
      <div class="result bg-white w-[40%]">
        <div class="title text-2xl font-bold h-12 mb-6">Result</div>
        <div :class="{ 'text-error': error, 'text-primary-darkest': !error }">
          {{ result }}
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
const monaco = useMonaco();
const blurr = useBlurr();

const container = ref<HTMLElement | null>(null);

const enabled = ref(false);
const code = ref(`
url = "https://raw.githubusercontent.com/hi-primus/optimus/develop/examples/data/foo.csv";

df = blurr.readCsv({ url });

return await df.cols.names();
`);
const result = ref('');
const error = ref(false);

async function runCode() {
  const AsyncFunction = eval('(async function() { return true }).constructor');

  try {
    error.value = false;
    result.value = await AsyncFunction(code.value)();
    //
  } catch (err) {
    console.error(err);
    if (err instanceof Error) {
      error.value = true;
      result.value = err.message;
    }
  }

  return false;
}

const initializeEditor = () => {
  if (container.value) {
    const editor = monaco.editor.create(container.value, {
      value: code.value,
      language: 'javascript',
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: {
        enabled: false
      }
    });

    editor.onDidChangeModelContent(() => {
      code.value = editor.getValue();
    });

    window.editor = editor;

    // editor.getModel().tokenization.setLanguageId('javascript');
  }
};

onMounted(() => {
  // monaco

  initializeEditor();

  const { Blurr } = blurr;
  if (window.client) {
    return;
  }
  window.monaco = monaco;
  window.blurr = Blurr({
    serverOptions: {
      scriptURL: 'https://cdn.jsdelivr.net/pyodide/v0.22.1/full/pyodide.js',
      useWorker: true,
      local: false
    }
  });
  window.blurr.runCode(`1+1`).then((result: string) => {
    console.info('Initialization result should be 2:', result);
    enabled.value = true;
  });
  // enabled.value = true;
});
</script>
