<template>
  <NuxtLayout>
    <div class="workspace-container">
      <Tabs :tabs="[{ label: 'df - tmp' }, {}, {}, {}]" />
      <WorkspaceDataframeLayout :dataframe="profile" :get-chunk="getChunk" />
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import type { Client, Source } from 'blurr/build/main/types';
import { Ref } from 'vue';

import { State } from '@/types/operations';
import { DataframeProfile } from '@/types/profile';

const blurrPackage = useBlurr();

const profile = ref<DataframeProfile | undefined>(undefined);

let blurr: Client;
let df: Source;

onMounted(async () => {
  const { Blurr } = blurrPackage;
  blurr = Blurr({
    serverOptions: {
      scriptURL: 'https://cdn.jsdelivr.net/pyodide/v0.21.3/full/pyodide.js',
      local: true
    }
  });
  window.blurr = blurr;
  await blurr.backendServer.donePromise;
  const result = await blurr.runCode("'successfully loaded'");
  df = blurr.readCsv(
    'https://raw.githubusercontent.com/hi-primus/optimus/develop/examples/data/foo.csv'
  );
  (window as any).df = df;
  console.info('Initialization result:', result);
  profile.value = df.profile();
  console.info('Profile result:', profile.value);
});

const getChunk = function (start: number, stop: number) {
  const chunk = {
    start,
    stop,
    data: df.iloc(start, stop).columnsSample().value
  };
  console.info('Chunk result:', chunk);
  return chunk;
};

// state logic

const state = ref<State>(null);
provide<Ref<State>>('state', state);

const test = ref<number>(42);
provide('test', test);
</script>

<style lang="scss">
.workspace-container {
  height: 100vh;
  width: 100vw;
  display: grid;
  grid-template-columns: 1fr minmax(180px, 420px);
  grid-template-rows: min-content min-content 1fr min-content;
  gap: 0px 0px;
  grid-auto-flow: row;
  grid-template-areas:
    'tabs tabs'
    'toolbar toolbar'
    'table operations'
    'footer footer';
}

.bumblebee-tabs {
  grid-area: tabs;
}
.workspace-toolbar {
  grid-area: toolbar;
}
.workspace-table {
  grid-area: table;
}
aside {
  grid-area: operations;
}
footer {
  height: 48px;
  grid-area: footer;
}
</style>
