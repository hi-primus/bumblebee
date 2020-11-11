<template>
  <DraggableConcat
    :items="datasetColumns"
    :selected="value"
    @update:selected="$emit('input',$event)"
    items-key="name"
    :items-name="'columns'"
  >
    <template v-slot:item="{ item }">
      <span class="data-item-title" :title="item.name">
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
      <span class="data-item-value" :title="item.value">
        {{item.value}}
      </span>

    </template>
    <template v-slot:item-output="{ item }">
      <span class="data-item-title" :title="item.name">
        <span
          class="data-type"
          :class="`type-${item.type}`"
        >
          {{dataTypeHint(item.type)}}
        </span>
        <EditableElement element="div" class="data-column-name" :title="item.name" :value="item.name" @input="item.update">
        </EditableElement>
      </span>
      <span class="data-item-hint" :title="item.hint">
        {{item.hint}}
      </span>

    </template>
  </DraggableConcat>
</template>

<script>
import DraggableConcat from '@/components/DraggableConcat'
import EditableElement from '@/components/EditableElement'
import dataTypesMixin from '@/plugins/mixins/data-types'

export default {

  mixins: [
    dataTypesMixin
  ],

  components: {
    DraggableConcat,
    EditableElement
  },

  props: ['value','disabled','datasetColumns']
}
</script>
