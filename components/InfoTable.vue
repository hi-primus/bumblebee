<template>
  <div v-if="data" class="">
    <div
      class="text-left bg-white rounded-md rounded-md border border-neutral-lightest/50 border-solid border-1"
    >
      <div v-if="data?.title" class="px-4 pt-4">
        <h2 class="text-md font-semibold text-neutral-alpha/60">
          {{ data.title }}
        </h2>
      </div>

      <div v-if="data?.topContent" class="px-4 pt-2">
        <p class="whitespace-pre-line font-normal text-xs text-neutral-light">
          {{ data.topContent }}
        </p>
      </div>

      <div class="pt-2 text-sm">
        <table class="w-full">
          <thead
            v-if="data?.header?.length"
            class="text-neutral-alpha/60 font-semibold"
          >
            <tr>
              <th
                v-for="(headerItem, index) in data?.header"
                :key="index"
                class="border-b border-neutral-lightest/50 cell"
              >
                <span class="px-4" :title="headerItem">
                  {{ headerItem }}
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, rowIndex) in data?.values || []"
              :key="rowIndex"
              class="text-neutral-light"
            >
              <td v-for="(value, colIndex) in row" :key="colIndex" class="cell">
                <span class="px-4" :title="value">
                  {{ value }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface InfoTableData {
  title?: string;
  topContent?: string;
  header?: string[];
  values?: (string | number)[][];
}

defineProps({
  data: {
    type: Object as PropType<InfoTableData>,
    default: null
  }
});
</script>

<style scoped lang="scss">
.cell {
  position: relative;
  height: 2em;
}
tbody tr:last-child .cell {
  height: 2.5em;
  padding-bottom: 0.5em;
}
tbody tr:first-child .cell {
  height: 2.25em;
  padding-top: 0.25em;
}
.cell:before {
  content: '&nbsp;';
  visibility: hidden;
}
.cell span {
  position: absolute;
  left: 0;
  right: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
