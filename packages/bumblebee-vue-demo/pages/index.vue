<template>
  <NuxtLayout>
    <div class="workspace-container">
      <Tabs :tabs="[{ label: 'df - tmp' }, {}, {}, {}]" />
      <WorkspaceDataframeLayout :dataframe="profile" :get-chunk="getChunk" />
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import type { Client, Source } from 'blurr';

import { DataframeProfile } from '@/types/profile';

const blurr = useBlurr();

const profile = ref<DataframeProfile | undefined>(undefined);

let client: Client;
let df: Source;

onMounted(async () => {
  const { BlurrClient } = blurr;
  client = BlurrClient({
    serverOptions: {
      scriptURL: 'https://cdn.jsdelivr.net/pyodide/v0.21.3/full/pyodide.js'
    }
  });
  window.client = client;
  const result = await client.runCode(`
import micropip
await micropip.install("https://test-files.pythonhosted.org/packages/88/8e/287b914c98fbb6afb0cf666a746fcc2b56a16e5bd814edfc0654b2bf8b8b/pyoptimus-0.1.4017-py3-none-any.whl")

from optimus import Optimus
from pyodide.http import pyfetch
from io import BytesIO

op = Optimus("pyscript")

df = op.create.dataframe(name=["John", "Peter", "Mary"], age=[30, 25, 27])

async def url_to_buffer(url):
    fetch_response = await pyfetch(url)
    js_buffer = await fetch_response.buffer()
    return BytesIO(js_buffer.to_py())
    
"successfully loaded"
  `);
  df = await client.readCsv(
    'https://raw.githubusercontent.com/hi-primus/optimus/develop/examples/data/foo.csv'
  );
  console.info('Initialization result:', result);
  profile.value = await df.profile();
  console.info('Profile result:', profile.value);
});

const getChunk = async function (start: number, stop: number) {
  const chunk = {
    start,
    stop,
    data: (await df.iloc({ start, stop }).columnsSample()).value
  };
  console.info('Chunk result:', chunk);
  return chunk;
};
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
