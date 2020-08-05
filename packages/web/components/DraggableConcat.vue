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
            :value="textFieldsValues[textField]"
            @input="updateTextField(textField, $event)"
            dense
            class="denser"
            outlined
            hide-details
          >
          </v-text-field>
        </div>
      </div>
    </div>
    <h3 class="grey--text">Dropped {{itemsName}}</h3>
    <div class="concat-items-set deleted-items">
      <span class="deleted-items-empty text-caption grey--text" v-if="showEmptyDeleted">
        Drop unwanted {{itemsName}} here
      </span>
      <draggable
        @start="startDrag"
        v-for="(notSelected, index) in notSelected"
        :key="index"
        tag="div"
        id="deleted-items-col"
        class="items-col"
        :list="notSelected"
        v-bind="{...dragOptions, group: 'items'+index}"
      >
        <template
          v-for="(item, index) in notSelected"
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
    itemsName: {
      type: String,
      default: 'items'
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

    showEmptyDeleted () {
      if (!this.notSelected) {
        return true
      }
      return !(this.notSelected || [[]]).some(e=>e.length)
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

      } else if (!deletedEmpty) {
        this.updateSelection()
      }
    },

    textFieldsValues: {
      deep: true,
      handler: 'updateSelection'
    },

    localSelected () {

      var defaultValues = this.localSelected.map(e=>{
          if (!e.items) {
            return 'error'
          }
          e.items = e.items.filter(ee=>ee).map(ee=>ee[this.itemsKey] ? ee[this.itemsKey] : ee)
          if (e.items.every(ee=>ee==e.items[0])) {
            return e.items[0]
          } else {
            return e.items.join('_')
          }
        }
      )

      var textFieldsValues = {};

      defaultValues.forEach(name=>{
        if (name) {
          textFieldsValues[name] = this.textFieldsValues[name] || ''
        }
      })

      if (JSON.stringify(this.textFieldsValues)!==JSON.stringify(textFieldsValues)) {
        this.textFieldsValues = textFieldsValues;
      }

      this.textFields = defaultValues
    },


  },

  methods: {

    updateTextField (field, value) {
      this.$set(this.textFieldsValues, field, value)
    },

    updateSelection () {

      var rows = transpose(this.itemsSlotsGroups.map(itemsSlots=>{
        var items = itemsSlots.map(itemArray=>{
          return (itemArray && itemArray[0]) ? itemArray[0] : false;
        })
        items.splice(items.length-1,1);
        return items
      })).map((items, i)=>{
        return {
          items,
          value: this.textFieldsValues[this.textFields[i]] || this.textFields[i] || 'und'
        }
      })

      this.localSelected = rows
    },

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
