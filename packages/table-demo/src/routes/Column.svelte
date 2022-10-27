<script lang="ts">
export let title: string;
</script>

<div class="column">
  <div class="title">{title}</div>
  <div class="cells">
    <slot />
  </div>
</div>

<style lang="scss">
.column {
  display: flex;
  flex-direction: column;
  width: 200px;
  & > .title {
    padding: 0.25rem;
    border-bottom: 1px solid #d1d1d1;
    margin-bottom: 0.5rem;
    font-size: 1.2rem;
    font-weight: 600;
  }
  & > .cells {
    display: flex;
    flex-direction: column;
    padding: 0.25rem;
    position: relative;
  }
}
</style>
