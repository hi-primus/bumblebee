<script lang="ts">
import Tab, { Label } from '@smui/tab';
import TabBar from '@smui/tab-bar';

export let tabs: any[] = [];
let active = tabs.length > 0 ? tabs[0] : null;
</script>

<section class="tabs">
  <TabBar {tabs} let:tab bind:active>
    <Tab {tab} minWidth>
      {tab}
    </Tab>
  </TabBar>
</section>
