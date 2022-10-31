<script lang="ts">
  import Tabs from '$lib/components/Tabs.svelte';
</script>

<!-- <div class="flex flex-col h-screen"> -->
<div class="workspace">
  <Tabs tabs={['page1', 'page2']} />
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
