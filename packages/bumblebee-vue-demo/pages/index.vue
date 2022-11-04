<template>
  <NuxtLayout>
    <div class="workspace-container">
      <Tabs :tabs="[{ label: 'Dataset 1' }, {}, {}, {}]" />
      <WorkspaceDataframeLayout />
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">

// const { $blurr } = useNuxtApp();

// onMounted(async () => {
//   const { BlurrClient } = $blurr;
//   const client = BlurrClient({serverOptions: { scriptURL: "https://cdn.jsdelivr.net/pyodide/v0.21.3/full/pyodide.js" }});
//   window.client = client;
//   const df = await client.readCsv({
//     url: 'https://raw.githubusercontent.com/hi-primus/optimus/develop/examples/data/foo.csv',
//   });
//   console.log(df);
// })

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
.workspace-aside {
  grid-area: operations;
}
.workspace-footer {
  height: 48px;
  grid-area: footer;
}
</style>
