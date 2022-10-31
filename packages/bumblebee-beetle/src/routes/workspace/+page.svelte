<script lang="ts">
import DataframeLayout from '$components/Workspace/DataframeLayout.svelte';
import Tabs from '$components/Tabs.svelte';
</script>

<!-- <div class="flex flex-col h-screen"> -->
<div class="workspace-container">
  <Tabs tabs={['page1', 'page2']} />
  <DataframeLayout />
</div>
<main class="workspace" />

<!-- </div> -->
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

:global {
  .workspace-tabs {
    height: 48px;
    grid-area: tabs;
    background-color: lighten(red, 30%);
  }
  .workspace-toolbar {
    height: 64px;
    grid-area: toolbar;
    background-color: lighten(blue, 30%);
  }
  .workspace-table {
    grid-area: table;
    background-color: lighten(green, 50%);
  }
  aside {
    grid-area: operations;
    background-color: lighten(yellow, 30%);
  }
  footer {
    height: 48px;
    grid-area: footer;
    background-color: lighten(purple, 50%);
  }
}
</style>
