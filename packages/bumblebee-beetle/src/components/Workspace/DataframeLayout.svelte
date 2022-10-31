<script lang="ts">
import Toolbar from './Toolbar.svelte';
import Operations from './Operations.svelte';
import Footer from './Footer.svelte';

import ChunksTable from '$components/Table/ChunksTable.svelte';
</script>

<Toolbar />
<section class="workspace-table">
  <ChunksTable />
</section>
<Operations />
<Footer />
