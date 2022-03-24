<template>
  <div class="concat-items-component">
    <SearchSelect
      v-if="searchSelectAttach"
      :attach="searchSelectAttach"
      :items="searchItems"
      @input="itemSelected"
      @menu-input="searchMenuInput"
    />
    <div class="concat-items-set concat-items">
      <div class="items-cols">
        <div
          v-for="(itemsSlotsGroup, groupIndex) in itemsSlotsGroups"
          :key="'isg'+groupIndex"
          class="items-col"
        >
          <template v-for="(slotArray, slotIndex) in itemsSlotsGroup">
            <div
              :key="groupIndex+''+slotIndex"
              class="items-item"
              :class="{'empty-slot': !slotArray || !slotArray[0]}"
            >
              <draggable
                @start="startDrag"
                @end="endDrag"
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
                  <v-icon
                    small
                    class="close-button"
                    @click="removeItem(groupIndex, slotIndex)"
                  >
                    close
                  </v-icon>
                </div>
              </draggable>
              <v-icon small color="primary" :ripple="false" class="search-button" @click="triggerSearch(groupIndex, slotIndex, $event)">search</v-icon>
            </div>
          </template>
        </div>

      </div>
      <div class="output-col">
        <div
          v-for="(item, index) in outputItems"
          :key="item[itemsKey]"
          class="items-item concat-item"
        >
          <slot
            name="item-output"
            :item="item"
          >
            {{item[itemsKey]}}
          </slot>
          <v-icon
            small
            class="close-button"
            @click="removeRow(index)"
          >
            close
          </v-icon>
        </div>
      </div>
    </div>
    <h3 class="concat-deleted-title grey--text pt-2">Dropped {{itemsName}}</h3>
    <div class="concat-items-set deleted-items">
      <span class="deleted-items-empty text-caption grey--text" v-if="showEmptyDeleted">
        Drop unwanted {{itemsName}} here
      </span>
      <draggable
        @start="startDrag"
        @end="endDrag"
        v-for="(notSelected, index) in notSelected"
        :key="index"
        tag="div"
        id="deleted-items-col"
        class="items-col deleted-items-col"
        :list="notSelected"
        :move="checkMove"
        v-bind="{...dragOptions, group: 'items'+index}"
      >
        <template
          v-for="(item, index) in notSelected"
        >
          <div
            v-if="!item || item.empty"
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

import { propsToLocal, deepCopy, incrementVarName, debounce, transpose } from 'bumblebee-utils'
import SearchSelect from '@/components/SearchSelect'

export default {
  components: {
    SearchSelect
  },

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
      searchPromise: false,
      searchSelectAttach: false,
      searchItems: [],
      itemsLength: -1,
      itemsSlotsGroups: [],
      notSelected: [],
      textFields: [],
      textFieldsValues: {}
    }
  },

  computed: {

    outputItems () {

      var totalDatasets = this.itemsSlotsGroups.length;

      return this.textFields.map((textFieldKey, index)=>{
        var obj = {};

        obj.update = (value)=>{
          this.$set(this.textFieldsValues, textFieldKey, value)
        };

        //

        var types = this.itemsSlotsGroups.map(e=>e[index] && e[index][0] ? e[index][0].type : undefined).filter(e=>e);

        obj.hint = `${types.length} of ${totalDatasets} columns`;

        if (types.every(type=>type===types[0])) {
          obj.type = types[0];
        } else if (types.every(type=>['float','int'].includes(type))) {
          obj.type = 'float';
        } else {
          obj.type = 'string';
        }

        //

        obj[this.itemsKey] = this.textFieldsValues[textFieldKey] || textFieldKey;

        return obj;
      });
    },

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
      return !(this.notSelected || [[]]).some(e=>e && e.length)
    },

    ...propsToLocal(['items', 'selected']),

  },

  mounted () {
    this.resetItemsSlotsGroups(false);
  },

  watch: {

    items: {
      deep: true,
      handler (items) {
        if (items.length!==this.itemsLength) {
          let reset = this.itemsLength > 0;
          this.itemsLength = items.length;
          this.resetItemsSlotsGroups(reset);
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
      this.updateTextFields()
    },


  },

  methods: {

    searchMenuInput (e) {
      if (!e) {
        this.searchSelectAttach = false;
        this.searchItems = [];
        if (this.searchPromise && this.searchPromise.reject) {
          this.searchPromise.resolve(false);
        }
      }
    },

    itemSelected (item) {
      if (this.searchPromise && this.searchPromise.resolve) {
        this.searchPromise.resolve(item);
      }
    },

    triggerSearch (groupIndex, slotIndex, event) {

      setTimeout(async () => {
        try {
          var item = await new Promise((resolve, reject) => {
            this.searchPromise = {resolve, reject}
            var element = event.target.closest('.items-item');
            this.searchSelectAttach = element;
            this.searchItems = this.items[groupIndex];
          })
          if (item) {
            this.moveItem(groupIndex, slotIndex, item);
          }
        } catch (err) {
          console.error(err);
        }
        this.searchPromise = false;
        this.searchSelectAttach = false;
        this.searchItems = [];
      }, 25);
    },

    moveItem (groupIndex, slotIndex, item) {

      var previousSlotIndex = this.itemsSlotsGroups[groupIndex].findIndex(e=>e && e[0] && e[0][this.itemsKey] == item[this.itemsKey])
      var droppedSlot = false;

      if (previousSlotIndex === -1) {
        previousSlotIndex = this.notSelected[groupIndex].findIndex(e=>e && e[this.itemsKey] == item[this.itemsKey])

        if (previousSlotIndex >= 0) {
          droppedSlot = true;
        }
      }

      var itemsSlotsGroups = Array.from(this.itemsSlotsGroups);

      if (droppedSlot) {
        this.notSelected[groupIndex].splice(previousSlotIndex, 1);
      } else {
        itemsSlotsGroups[groupIndex][previousSlotIndex] = [];
      }

      itemsSlotsGroups[groupIndex][slotIndex][0] = item;

      var deleteEmptyResults = this.deleteEmptyItemsSlots(itemsSlotsGroups);
      if (deleteEmptyResults) {
        itemsSlotsGroups = deleteEmptyResults;
      }

      this.itemsSlotsGroups = itemsSlotsGroups;

    },

    removeItem (groupIndex, slotIndex) {
      if (!this.itemsSlotsGroups[groupIndex][slotIndex].length) {
        return false;
      }
      this.itemsSlotsGroups[groupIndex][slotIndex].forEach(e=>{
        this.notSelected[groupIndex].push(e);
      })
      var itemsSlotsGroups = Array.from(this.itemsSlotsGroups);
      itemsSlotsGroups[groupIndex][slotIndex] = []
      var deleteEmptyResults = this.deleteEmptyItemsSlots(itemsSlotsGroups);
      if (deleteEmptyResults) {
        itemsSlotsGroups = deleteEmptyResults;
      }
      this.itemsSlotsGroups = itemsSlotsGroups;
      return true;
    },

    removeRow (rowIndex) {

      this.$delete(this.textFieldsValues, this.textFields[rowIndex]);

      this.$delete(this.textFields, rowIndex);

      let itemsSlotsGroups = Array.from(this.itemsSlotsGroups);

      this.notSelected.forEach((notSelectedGroup, colIndex) => {
        this.itemsSlotsGroups[colIndex][rowIndex].forEach(e=>{
          this.notSelected[colIndex].push(e);
        })
        itemsSlotsGroups[colIndex][rowIndex] = []
        return true;
      })

      let deleteEmptyResults = this.deleteEmptyItemsSlots(itemsSlotsGroups);
      if (deleteEmptyResults) {
        itemsSlotsGroups = deleteEmptyResults;
      }
      this.itemsSlotsGroups = itemsSlotsGroups;

    },

    updateTextFields () {
      try {
        let defaultValues = [];
        let textFieldsValues = {};
  
        this.localSelected.forEach(row=>{
          let name = 'error';
  
          if (row.items && row.items.length) {
  
            let items = row.items.filter(col=>col).map(col=>col[this.itemsKey] ? col[this.itemsKey] : col)
            if (items.every(col=>col==items[0])) {
              name = items[0];
            } else {
              name = items.join('_');
            }
  
          }
  
          let fieldName = incrementVarName(name, defaultValues);
          name = incrementVarName(name, Object.values(textFieldsValues));
  
          defaultValues.push(fieldName);
          textFieldsValues[fieldName] = row.value || this.textFieldsValues[fieldName] || name || '';
  
        });
  
        if (JSON.stringify(this.textFieldsValues)!==JSON.stringify(textFieldsValues)) {
          this.textFieldsValues = textFieldsValues;
        }
  
        this.textFields = defaultValues;

      } catch (err) {
        console.error(err);
      }

    },

    resetItemsSlotsGroups (reset = false) {

      try {

        let length = Math.max(...this.items.map(col=>col.length))+1;
        let itemsSlotsGroups;

        if (reset || !this.selected.length) {
          itemsSlotsGroups = this.items;
        } else {
          itemsSlotsGroups = transpose(this.selected.map(row => row.items));
        }

        this.itemsSlotsGroups = itemsSlotsGroups.map(col => {
          let array = col ? Array.from(col) : [];
          let al = array.length
          array.length = length
          array.fill(false, al)
          return array.map(e=>(e ? [e] : []))
        });

        if (reset || !this.selected.length) {
          this.notSelected = this.items.map(col=>[]);
        } else {
          this.updateTextFields();
          this.notSelected = this.items.map((col, colIndex) => {
            let array = [];
            col.forEach(e => {
              if (e && e.name && !this.itemsSlotsGroups[colIndex].find(ie => ie && ie.length && ie[0].name === e.name)) {
                array.push(e);
              }
            });
            return array;
          });
        }
      } catch (err) {
        console.error(err);
      }

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
        let items = rowItems.map(it=>it!=='_BB_EMPTY_SLOT_' ? it : false);
        let firstItemName = items.find(it=>it && it.name).name;

        return {
          items,
          value: this.textFieldsValues[this.textFields[i]] || this.textFields[i] || firstItemName || ''
        }
      });

      rows = rows.map((row, rowIndex) => {
        let previousRow = rows.slice(0, rowIndex);
        let previousRowValues = previousRow.map(r=>r.value);
        row.value = incrementVarName(row.value, previousRowValues);
        return row;
      });

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
      return ($event.from === $event.to || !$event.relatedContext.list.length || $event.to.id==='deleted-items-col');
    }
  }

}
</script>
