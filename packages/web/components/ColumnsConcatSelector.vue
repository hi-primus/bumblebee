<template>
  <DraggableConcat
    :items="datasetColumns"
    :selected="value"
    @update:selected="$emit('input',$event)"
    items-key="name"
    :items-name="'columns'"
  >
    <template v-slot:item="{ item }">
      <span :title="item.name">
        <span
          class="data-type"
          :class="`type-${item.type}`"
        >
          {{dataTypeHint(item.type)}}
        </span>
        <span class="data-column-name">
          {{item.name}}
        </span>
      </span>

    </template>
  </DraggableConcat>
</template>

<script>
import DraggableConcat from '@/components/DraggableConcat'
import dataTypesMixin from '@/plugins/mixins/data-types'

export default {

  mixins: [
    dataTypesMixin
  ],

  components: {
    DraggableConcat
  },

  props: ['value','disabled','datasetColumns']
}
</script>
