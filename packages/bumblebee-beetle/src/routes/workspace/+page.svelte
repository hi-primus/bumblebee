<script lang="ts">
  import Tab, { Label } from '@smui/tab';
  import TabBar from '@smui/tab-bar';

  let tabs = ['page 1', 'page 2'];
  let active = tabs[0];
</script>

<!-- <div class="flex flex-col h-screen"> -->
<div class="workspace">
  <section class="tabs">
    <TabBar {tabs} let:tab bind:active>
      <Tab {tab} minWidth>
        {tab}
      </Tab>
    </TabBar>
  </section>
  <section>[BAR]</section>
  <section class="w-full row-span-5">
    <div class="flex">
      <div class="w-full overflow-y-auto">
        <div>item</div>
        <!-- <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div>
        <div>item</div> -->
      </div>
      <div class="w-1/3">[OPERATIONS]</div>
    </div>
  </section>
  <footer>[FOOTER]</footer>
</div>

<!-- </div> -->
<style lang="scss">
  .workspace {
    display: grid;
    grid-template-rows: repeat(18, minmax(0, 1fr));
  }
  // .table-container {
  //   height: calc(100vh - 72px);
  // }
</style>
