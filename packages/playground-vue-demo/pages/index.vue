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
            @click="runCode"
            class="bg-primary hover:bg-primary-700 text-white rounded px-4 py-2"
          >
            {{ enabled ? 'Run' : 'Loading...' }}
          </button>
          <div class="hints h-full py-2 px-6">
            Client variable name:
            <span class="font-mono text-primary-800">client</span>
          </div>
        </div>
        <!-- a text area that when i press shift enter alerts its content -->
        <textarea
          @keyup.prevent.shift.enter="runCode"
          spellcheck="false"
          class="bg-primary-50 font-mono text-text-alpha rounded p-4 h-[calc(100%-64px)] w-full"
          v-model="code"
        >
        </textarea>
      </div>
      <div class="result bg-white w-[40%]">
        <div class="title text-2xl font-bold h-12 mb-6">Result</div>
        <div :class="{ 'text-error': error, 'text-primary-800': !error }">
          {{ result }}
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
const blurr = useBlurr();

const enabled = ref(false);
const code = ref(`
df = await client.readCsv({
  url: "https://raw.githubusercontent.com/hi-primus/optimus/develop/examples/data/foo.csv"
});

return await df.columns();
`);
const result = ref('');
const error = ref(false);
const mask = ref({});

async function runCode(event: KeyboardEvent) {
  const AsyncFunction = eval('(async function() { return true }).constructor');

  event.preventDefault();

  try {
    error.value = false;
    result.value = await AsyncFunction(code.value)();
    //
  } catch (err) {
    if (err instanceof Error) {
      error.value = true;
      result.value = err.message;
    }
  }

  return false;
}

onMounted(() => {
  const { BlurrClient } = blurr;
  if (window.client) {
    return;
  }
  window.client = BlurrClient({
    serverOptions: {
      scriptURL: 'https://cdn.jsdelivr.net/pyodide/v0.21.3/full/pyodide.js'
    }
  });
  window.client.run(`1+1`).then((result: string) => {
    console.info('Initialization result should be 2:', result);
    enabled.value = true;
  });
});
</script>
