<template>
  <div class="concat-items-component">
    <div class="concat-items-set concat-items">
      <div class="items-cols">
        <div
          v-for="(itemsSlotsGroup, groupIndex) in itemsSlotsGroups"
          :key="'isg'+groupIndex"
          class="items-col"
        >
          <template v-for="(slotArray, slotIndex) in itemsSlotsGroup">
            <draggable
              :key="groupIndex+''+slotIndex"
              @start="startDrag"
              tag="div"
              class="items-item items-slot"
              :list="slotArray"
              v-bind="{...dragOptions, group: 'items'+groupIndex}"
              :move="checkMove"
            >
              <div
                v-if="slotArray && slotArray[0]"
                class="concat-draggable concat-item text-ellipsis"
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
      <div class="fields-col pl-1">
        <div
          v-for="textField in textFields"
          :key="textField"
          class="items-item items-fields"
        >
          <v-text-field
            :placeholder="textField"
            :v-model="textFieldsValues[textField]"
            dense
            class="denser"
            outlined
            hide-details
          >
          </v-text-field>
        </div>
      </div>
    </div>
    <h3 class="grey--text">Deleted</h3>
    <div class="concat-items-set deleted-items">
      <draggable
        @start="startDrag"
        v-for="(notSelectedItems, index) in notSelected"
        :key="index"
        tag="div"
        id="deleted-items-col"
        class="items-col"
        :list="notSelectedItems"
        v-bind="{...dragOptions, group: 'items'+index}"
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
  </div>
</template>


<script>

import { propsToLocal, debounce, transpose } from 'bumblebee-utils'

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
      notSelected: [],
      textFields: [],
      textFieldsValues: {}
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

    },

    localSelected () {
      var names = transpose(this.localSelected).map(e=>{
          e = e.filter(e=>e).map(e=>e[this.itemsKey] ? e[this.itemsKey] : e)
          if (e.every(ee=>ee==e[0])) {
            return e[0]
          } else {
            return e.join('_')
          }
        }
      )
      var textFieldsValues = {}
      names.forEach(name=>{
        textFieldsValues[name] = this.textFieldsValues[name] || ''
      })

      this.textFieldsValues = textFieldsValues
      this.textFields = names
    },


  },

  methods: {

    deleteEmptyItemsSlots () {

      var itemsSlotsGroups = this.itemsSlotsGroups
      var found = false

      var itemsSlotsPairs = transpose(itemsSlotsGroups)

      for (let i = itemsSlotsPairs.length-2; i >= 0; i--) {
        if (itemsSlotsPairs[i].every(e=>!e.length)) {
          found = true
          itemsSlotsPairs.splice(i,1)
        }
      }

      if (found) {
        this.itemsSlotsGroups = transpose(itemsSlotsPairs);
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
      return (!$event.relatedContext.list.length || $event.from === $event.to || $event.to.id==='deleted-items-col')
    }
  }

}
</script>
