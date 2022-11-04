<template>
  <div class="z-20 w-full h-full overflow-auto">
    <div 
      class="
        bumblebee-table-container
        relative
        flex
        h-full
        w-[max-content]
        text-sm
        font-mono-table
        text-text
      "
    >
      <div class="bumblebee-columns-rows-backgrounds sticky h-full w-full ml-[-100%] left-0 order-[-1]">
        <div
          v-for="row in rowsData"
          :style="{ top: columnHeaderHeight+(row.__bumblebee__rowIndex)*24 + 'px' }"
          class="
            h-[24px]
            absolute
            bg-white
            pr-2
            z-[-3]
            text-right
            w-full
            op-50
            bg-white
          "
        >
        </div>
      </div>
      <div
        class="bumblebee-table relative max-w-full flex pb-[160px]"
        :style="{ height: columnHeaderHeight + lastRowIndex*24 + 160 + 'px' }"
      >
        <div
          class="bumblebee-table-column relative min-w-[160px] z-[0]"
          v-for="column in header"
        >
          <div
            class="
              border-line-light border-b border-r
              sticky
              top-0
              bg-white
              z-[2]
              font-mono
            "
          >
            <div
              class="
                column-title
                border-line-light border-b
                text-[16px]
                py-1
                px-3
                text-center
                flex
                align-center
              "
            >
              <Icon
                :path="mdiTableColumn"
                class="left-icon inline text-text/90 mr-[2px]"
              />
              <span class="flex-1">
                {{column.name}}
              </span>
              <div class="flex-1 max-w-[24px] right-icon"></div>
            </div>
            <div class="italic px-3 py-4">
              [-------------][--]
            </div>
          </div>
          <div
            class="
              absolute px-1
              border-line-light border
              w-[calc(100%+1px)]
              h-[25px]
              ml-[-1px]
              mt-[-1px]
              ellipsis
            "
            v-for="(row) in rowsData"
            :style="{ top: columnHeaderHeight+(row.__bumblebee__rowIndex)*24 + 'px' }"
          >
            {{row ? row[column?.name] : "None"}}
          </div>
        </div>
      </div>
      <div class="sticky h-full left-0 order-[-1]">
        <div
          class="
            bumblebee-columns-rows-indices
            h-full
            bg-white text-text-lighter
            border-line-light border-r
            font-mono
            font-200
            text-right
          "
          :style="{ width: rowIndicesWidth }"
        >        
          <div
            v-for="(row) in rowsData"
            :style="{ top: columnHeaderHeight+(row.__bumblebee__rowIndex)*24 + 'px' }"
            class="
              h-[24px]
              absolute
              w-full
              pr-[6px]
              z-[1]
              bg-white
              border-line-light border-r
            "
          >
            {{row.__bumblebee__rowIndex}}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

  import { mdiTableColumn } from '@mdi/js'
import { PropType } from 'vue';

  const { data } = defineProps({
    data: {
      type: Array as PropType<Array<object>>
    },
    header: {
      type: Array
    }
  });

  const rowIndicesWidth = '48px' // TODO: Width from rows number
  const columnHeaderHeight = 83 // TODO: Width from rows number

  const rowsData = computed(() => {
    const rowsData = [];
    data.forEach((row: object, rowIndex: number) => {
      rowsData.push({
        ...row,
        __bumblebee__rowIndex: rowIndex
      })
    });
    return rowsData;
  });

  const lastRowIndex = computed(() => {
    return rowsData.value[rowsData.value.length - 1].__bumblebee__rowIndex;
  })
</script>
