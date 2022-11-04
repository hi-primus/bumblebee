<template>
  <WorkspaceToolbar />
  <section class="workspace-table overflow-hidden">
    <TableChunksTable
      class="overflow-auto"
      :header="header"
      :chunks="chunks"
    />
  </section>
  <WorkspaceOperations />
  <WorkspaceFooter />
</template>

<script setup lang="ts">
  defineProps({
    dataframe: {
      type: Object
    }
  });

  const header = [
    {
      name: "Name"
    },
    {
      name: "ID"
    },
    {
      name: "Date"
    }
  ]

  let chunks = Array(80)

  for (let i = 0; i < 10; i++){
    chunks[i] = { Name: "Person #"+i, ID: i, Date: new Date(new Date().getUTCMilliseconds() + i*100) }
  }
  
  for (let i = 20; i < 80; i++){
    chunks[i] = { Name: "Person #"+i, ID: i, Date: new Date(new Date().getUTCMilliseconds() + i*100) }
  }
</script>
