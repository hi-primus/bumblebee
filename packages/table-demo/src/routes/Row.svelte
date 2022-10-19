<script lang="ts">
  export let row: Record<string, any>;
</script>
<div>
  {#each Object.keys(row) as item}
    <div>{row[item]}</div>
  {/each}
</div>