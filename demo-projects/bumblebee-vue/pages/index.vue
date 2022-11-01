<template>
  <NuxtLayout>
    <div class="workspace-container">
      <Tabs :tabs="[{ label: '(dataset long name)' }, {}, {}, {}]" />
      <WorkspaceDataframeLayout />
    </div>
  </NuxtLayout>
</template>

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
  height: 48px;
  grid-area: tabs;
  background-color: lighten(red, 45%);
}
.workspace-toolbar {
  height: 64px;
  grid-area: toolbar;
  background-color: lighten(blue, 45%);
}
.workspace-table {
  grid-area: table;
  background-color: lighten(green, 65%);
}
aside {
  grid-area: operations;
  background-color: lighten(yellow, 45%);
}
footer {
  height: 48px;
  grid-area: footer;
  background-color: lighten(purple, 65%);
}
</style>
