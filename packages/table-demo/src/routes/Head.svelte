<script lang="ts">
  export let head: String[]
</script>
<div>
  <div>
    {#each head as item}
      <div>{item}</div>
    {/each}
  </div>
</div>
