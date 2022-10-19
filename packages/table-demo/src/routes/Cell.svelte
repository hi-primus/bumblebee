<script lang="ts">
  export let cellId: number
</script>

<div
  class="cell"
  style="top:{cellId * 22}px;"
>
  <slot />
</div>

<style lang="scss">
.cell {
  min-height: 20px;
  width:100%;
  display: flex;
  align-items: center;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  position: absolute;
}
</style>