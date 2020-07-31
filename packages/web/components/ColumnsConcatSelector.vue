<template>
  <DraggableConcat
    :items="columns"
    :selected="value"
    @update:selected="$emit('input',$event)"
    items-key="name"
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
import dataTypesMixin from '@/plugins/mixins/data-types'

export default {

  mixins: [
    dataTypesMixin
  ],
  props: ['value','disabled','datasetColumns']
}
</script>
