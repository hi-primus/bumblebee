<template>
  <div class="concat-items-component pb-5">
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
            @click="removeOutputItem(index)"
          >
            close
          </v-icon>
          <!-- <v-text-field
            :placeholder="textField"
            :value="textFieldsValues[textField]"
            @input="updateTextField(textField, $event)"
            dense
            label="Column name"
            clearable
            outlined
            hide-details
          >
          </v-text-field> -->
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

import { propsToLocal, debounce, transpose } from 'bumblebee-utils'
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
      itemsLength: 0,
      itemsSlotsGroups: [],
      notSelected: [],
      textFields: [],
      textFieldsValues: {}
    }
  },

  computed: {

    outputItems: {

      get () {
        return this.textFields.map((textFieldKey, index)=>{
          var obj = {};

          obj.update = (value)=>{
            this.$set(this.textFieldsValues, textFieldKey, value)
          };

          //

          var types = this.itemsSlotsGroups.map(e=>e[index] && e[index][0] ? e[index][0].type : undefined).filter(e=>e);

          if (types.every(type=>type===types[0])) {
            obj.type = types[0];
          } else if (types.every(type=>['decimal','int'].includes(type))) {
            obj.type = 'decimal';
          } else {
            obj.type = 'string';
          }

          //

          obj[this.itemsKey] = this.textFieldsValues[textFieldKey] || textFieldKey;

          return obj;
        });
      },
      set (v) {
        //
      }
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

      });

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
      this.notSelected[groupIndex].push(this.itemsSlotsGroups[groupIndex][slotIndex][0]);
      var itemsSlotsGroups = Array.from(this.itemsSlotsGroups);
      itemsSlotsGroups[groupIndex][slotIndex] = []
      var deleteEmptyResults = this.deleteEmptyItemsSlots(itemsSlotsGroups);
      if (deleteEmptyResults) {
        itemsSlotsGroups = deleteEmptyResults;
      }
      this.itemsSlotsGroups = itemsSlotsGroups;
    },

    removeOutputItem (slotIndex) {

      // return console.log({slotIndex})

      this.notSelected.forEach((notSelectedGroup, groupIndex)=>{
        this.removeItem(groupIndex, slotIndex);
      })

    },

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
