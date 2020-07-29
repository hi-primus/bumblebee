<template>
  <div class="concat-items-component">
    <div class="concat-items-set">
      <div
        v-for="(itemsSlotsGroup, groupIndex) in itemsSlotsGroups"
        :key="'isg'+groupIndex"
        class="items-col concat-items"
      >
        <template v-for="(slotArray, slotIndex) in itemsSlotsGroup">
          <draggable
            :key="groupIndex+''+slotIndex"
            @start="startDrag"
            tag="div"
            class="items-slot"
            :list="slotArray"
            v-bind="{...dragOptions, group: 'items'+groupIndex}"
            :move="checkMove"
          >
            <div
              v-if="slotArray && slotArray[0]"
              class="concat-draggable concat-item"
              :key="slotArray[0][itemsKey]"
            >
              <slot
                name="item"
                :item="slotArray[0]"
              >
                {{slotArray[0]}}
              </slot>
            </div>
          </draggable>
        </template>
      </div>
    </div>
  ______________________
    <div class="concat-items-set">
      <draggable
        @start="startDrag"
        v-for="(notSelectedItems, index) in notSelected"
        :key="index"
        tag="div"
        class="items-col deleted-items"
        :list="notSelectedItems"
        v-bind="{...dragOptions, group: 'items'+index}"
        style="min-width: 50px; min-height: 50px; background-color: blue"
      >
        <template
          v-for="(item, index) in notSelectedItems"
        >
          <div
            v-if="item.empty"
            class="concat-empty concat-item"
            :key="'empty'+index"
          >
          </div>
          <div
            v-else
            class="concat-draggable concat-item"
            :key="item[itemsKey]+index"
          >
            <slot
              name="item"
              :item="item"
            >
              {{item}}
            </slot>
          </div>
        </template>
      </draggable>

    </div>
    <br/>
    <br/>
    <br/>
    <div>
      aja
      {{items}}
      {{localItems}}
    </div>
    {{itemsSlotsGroups}}
  </div>
</template>


<script>

import { propsToLocal, debounce } from 'bumblebee-utils'

export default {
  props: {
    items: {
      type: Array
    },
    itemsKey: {
      type: String,
      default: 'id'
    },
    selected: {
      type: Array
    }
  },

  data () {
    return {
      itemsSlotsGroups: [],
      notSelected: []
    }
  },

  computed: {

    dragOptions () {
      return {
        animation: 200,
        deleted: this.commandsDisabled,
        ghostClass: "ghost"
      }
    },

    ...propsToLocal(['items', 'selected']),

  },

  mounted () {
    var length = Math.max(...this.items.map(eg=>eg.length))+1
    this.itemsSlotsGroups = this.items.map(eg=>{
      var array = Array.from(eg)
      var al = array.length
      array.length = length
      array.fill(false, al)
      return array.map(e=>(e ? [e] : []))

    })

    this.notSelected = this.items.map(eg=>[])
  },

  watch: {
    itemsSlotsGroups () {

      var addEmpty = this.itemsSlotsGroups.some(itemsSlotsGroup=>itemsSlotsGroup[itemsSlotsGroup.length - 1].length)

      var deletedEmpty = this.deleteEmptyItemsSlots()

      if (addEmpty) {
        this.itemsSlotsGroups = this.itemsSlotsGroups.map(itemsSlotsGroup=>[...itemsSlotsGroup, []]);
      } else if (!deletedEmpty){
        this.localSelected = this.itemsSlotsGroups.map(itemSlots=>{
          return itemSlots.map(itemArray=>{
            return (itemArray && itemArray[0]) ? itemArray[0] : false;
          })
        });
      }

    }


  },

  methods: {

    deleteEmptyItemsSlots () {

      var itemsSlotsGroups = this.itemsSlotsGroups
      var found = false

      for (let i = 0; i < itemsSlotsGroups[0].length - 1; i++) {
        var row = itemsSlotsGroups.map(e=>e[i]);
        if (row.every(e=>!e.length)) {
          found = true
          itemsSlotsGroups = itemsSlotsGroups.map(e=>{
            e.splice(i,1);
            return e;
          })
          i--
        }
      }

      if (found) {
        this.itemsSlotsGroups = itemsSlotsGroups;
      }

      return found
    },

    startDrag ($event) {
      if (!$event) {
        return false
      }
    },

    checkMove ($event) {
      console.log({$event})
      return (!$event.relatedContext.list.length || $event.from === $event.to)
      try {
        return this.itemsSlotsGroup[groupIndex][slotIndex].length<=0
      } catch (err) {
        return true
      }
    }
  }

}
</script>
