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
              @end="endDrag"
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
      itemsLength: 0,
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
        deleted: false, // this.$store.state.commandsDisabled
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
    this.updateItemsSlotsGroups();
  },

  watch: {

    items: {
      deep: true,
      handler (items) {
        if (items.length!==this.itemsLength) {
          this.itemsLength = items.length;
          this.updateItemsSlotsGroups();
        }

      }
    },

    itemsSlotsGroups: {
      deep: true,
      handler (value) {

        if (!value) {
          return;
        }

        var itemsSlotsGroups = Array.from(value);

        var addEmpty = itemsSlotsGroups.some(itemsSlotsGroup=>itemsSlotsGroup[itemsSlotsGroup.length - 1].length);

        var deleteEmptyResults = this.deleteEmptyItemsSlots(itemsSlotsGroups);

        if (deleteEmptyResults) {
          itemsSlotsGroups = deleteEmptyResults;
        }

        if (addEmpty) {
          itemsSlotsGroups = itemsSlotsGroups.map(group=>[...group, []]);
        }

        if (deleteEmptyResults || addEmpty) {
          this.itemsSlotsGroups = itemsSlotsGroups;
        } else {
          this.updateSelection();
        }

      }
    },

    textFieldsValues: {
      deep: true,
      handler: 'updateSelection'
    },

    localSelected () {

      var defaultValues = []
      this.localSelected.forEach(e=>{
          var name = 'error'

          if (e.items && e.items.length) {

            var items = e.items.filter(ee=>ee).map(ee=>ee[this.itemsKey] ? ee[this.itemsKey] : ee)
            if (items.every(ee=>ee==items[0])) {
              name = items[0]
            } else {
              name = items.join('_')
            }

          }

          while (defaultValues.includes(name)) {
            name = name+' copy'
          }

          defaultValues.push(name)

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

    updateItemsSlotsGroups () {

      var length = Math.max(...this.items.map(eg=>eg.length))+1;

      this.itemsSlotsGroups = this.items.map(eg=>{
        var array = eg ? Array.from(eg) : [];
        var al = array.length
        array.length = length
        array.fill(false, al)
        return array.map(e=>(e ? [e] : []))
      });

      this.notSelected = this.items.map(eg=>[]);
    },

    updateTextField (field, value) {
      this.$set(this.textFieldsValues, field, value)
    },

    updateSelection () {

      var columns = this.itemsSlotsGroups.map(itemsSlots=>{
        var colItems = itemsSlots.map(itemArray=>{
          return (itemArray && itemArray[0]) ? itemArray[0] : '_BB_EMPTY_SLOT_';
        })
        colItems.splice(colItems.length-1,1);
        return colItems
      })

      var rows = transpose(columns).map((rowItems, i)=>{
        return {
          items: rowItems.map(it=>it!=='_BB_EMPTY_SLOT_' ? it : false),
          value: this.textFieldsValues[this.textFields[i]] || this.textFields[i] || 'und'
        }
      })

      this.localSelected = rows
    },

    deleteEmptyItemsSlots (itemsSlotsGroups) {

      var found = false;

      var itemsSlotsPairs = transpose(itemsSlotsGroups);

      for (let i = itemsSlotsPairs.length-2; i >= 0; i--) {
        if (itemsSlotsPairs[i].every(e=>!e.length)) {
          found = true
          itemsSlotsPairs.splice(i,1)
        }
      }

      if (found) {
        itemsSlotsGroups = transpose(itemsSlotsPairs);
        return itemsSlotsGroups;
      }

      return undefined
    },

    startDrag ($event) {
      window.dragType = 'concat'
      if (!$event) {
        return false
      }
    },

    endDrag (noDrag = false) {
      window.dragType = false
    },

    checkMove ($event) {
      return (!$event.relatedContext.list.length || $event.from === $event.to || $event.to.id==='deleted-items-col')
    }
  }

}
</script>
