<template>
  <div class="o-field" :class="field.class || {}">
    <template v-if="getPropertyField(field.type)=='action'">
      <v-btn
        :key="field.key"
        depressed
        color="primary"
        @click="(field.func) ? command[field.func]() : 0"
        class="mb-6 mx-a d-flex"
        :loading="currentCommand[field.loading]"
        :disabled="!currentCommand[field.loading] && field.validate && !field.validate(currentCommand)"
      >
        {{
          {value: field.label, args: [currentCommand]} | property
        }}
      </v-btn>
    </template>
    <template v-else-if="getPropertyField(field.type)=='text'">
      <div
        :key="field.key"
        :class="{'title mb-4': field.big, 'mb-2 section-title': !field.big}"
        v-if="field.text"
      >
        {{
          {value: field.text, args: [currentCommand]} | property
        }}
      </div>
      <div
        :key="field.key"
        :class="{'title mb-4': field.big, 'mb-2 section-title': !field.big}"
        v-else
      >
        {{value}}
      </div>
    </template>
    <template v-else-if="getPropertyField(field.type)=='file'">
      <v-file-input
        v-model="_value"
        :key="field.key"
        :label="(typeof field.label == 'function') ? field.label(currentCommand) : (field.label || '')"
        :placeholder="(typeof field.placeholder == 'function') ? field.placeholder(currentCommand) : (field.placeholder || '')"
        :clearable="field.clearable"
        :accept="field.accept"
        @input="(field.onChange) ? field.onChange($event) : 0"
        dense
        required
        outlined
      ></v-file-input>
    </template>
    <template v-else-if="getPropertyField(field.type)=='field'">
      <v-text-field
        v-model="_value"
        :key="field.key"
        :label="getPropertyField(field.label)"
        :placeholder="(typeof field.placeholder == 'function') ? field.placeholder(currentCommand) : (field.placeholder || '')"
        :clearable="field.clearable"
        @input="(field.onChange) ? field.onChange($event) : 0"
        dense
        required
        outlined
      ></v-text-field>
    </template>
    <template v-else-if="getPropertyField(field.type)=='chips'">
      <v-combobox
        v-model="_value"
        :key="field.key"
        :label="(typeof field.label == 'function') ? field.label(currentCommand) : (field.label || '')"
        :placeholder="(typeof field.placeholder == 'function') ? field.placeholder(currentCommand) : (field.placeholder || '')"
        :clearable="field.clearable"
        autocomplete="off"
        chips
        deletable-chips
        :items="[]"
        class="chips-no-items"
        multiple
      >
      </v-combobox>
    </template>
    <template v-else-if="getPropertyField(field.type)=='autocomplete'">
      <v-autocomplete
        v-model="_value"
        :key="field.key"
        :label="(typeof field.label == 'function') ? field.label(currentCommand) : (field.label || '')"
        :placeholder="(typeof field.placeholder == 'function') ? field.placeholder(currentCommand) : (field.placeholder || '')"
        :clearable="field.clearable"
        chips
        deletable-chips
        :items="(field.items_key ? getPropertyField(currentCommand[field.items_key]) : getPropertyField(field.items)) || []"
        multiple
        class="multiline-select"
      >
      </v-autocomplete>
    </template>
    <template v-else-if="getPropertyField(field.type)=='autocomplete-repeat'">
      <v-autocomplete
        v-model="_value"
        :key="field.key"
        :label="(typeof field.label == 'function') ? field.label(currentCommand) : (field.label || '')"
        :placeholder="(typeof field.placeholder == 'function') ? field.placeholder(currentCommand) : (field.placeholder || '')"
        :clearable="field.clearable"
        chips
        deletable-chips
        :items="[
          ...currentCommand[field.key].map((item,i)=>({value: item, id: i, text: item})),
          ...((field.items_key ? getPropertyField(currentCommand[field.items_key]) : getPropertyField(field.items)) || [])
        ]"
        multiple
        class="multiline-select"
      >
      </v-autocomplete>
    </template>
    <template v-else-if="getPropertyField(field.type)=='outliers-range'">
      <Outliers
        :key="field.key"
        v-if="currentCommand[field.key]"
        :data="currentCommand[field.key]"
        :columnName="currentCommand.columns[0]"
        :selection.sync="currentCommand[field.selection_key]"
      />
    </template>
    <template v-else-if="getPropertyField(field.type)=='switch'">
      <v-switch
        :key="field.key"
        v-model="_value"
        color="black"
        :label="(typeof field.label == 'function') ? field.label(currentCommand) : field.label"
      ></v-switch>
    </template>
    <template v-else-if="getPropertyField(field.type)=='password'">
      <v-text-field
        v-model="_value"
        :key="field.key"
        :label="field.label"
        :placeholder="field.placeholder"
        dense
        required
        outlined
        :append-icon="field.showable ? (field.show ? 'visibility' : 'visibility_off') : undefined"
        :type="(field.show || !field.showable) ? 'text' : 'password'"
        :clearable="field.clearable"
        @input="(field.onChange) ? field.onChange($event) : 0"
        @click:append="field.show = !field.show"
      />
    </template>
    <template v-else-if="getPropertyField(field.type)=='number'">
      <v-text-field
        type="number"
        v-model="_value"
        :key="field.key"
        :label="field.label"
        :placeholder="field.placeholder"
        :min="field.min"
        :clearable="field.clearable"
        @input="(field.onChange) ? field.onChange($event) : 0"
        dense
        required
        outlined
      ></v-text-field>
    </template>
    <template v-else-if="getPropertyField(field.type)=='number_index'">
      <v-text-field
        type="number"
        :value="(currentCommand.index>=0) ? currentCommand.index : ''"
        @input="currentCommand.index = ($event>=0) ? $event : ''"
        :key="field.key"
        label="Index"
        :clearable="field.clearable"
        :max="(field.splits!=='') ? field.splits-1 : undefined"
        :placeholder="field.placeholder"
        :min="field.min"
        dense
        required
        outlined
      ></v-text-field>
    </template>
    <template v-else-if="getPropertyField(field.type)=='select' && (!field.items_key == !currentCommand[field.items_key])">
      <v-select
        :key="field.key"
        v-model="_value"
        :label="field.label"
        :placeholder="field.placeholder"
        :items="(field.items_key) ? getPropertyField(currentCommand[field.items_key]) : getPropertyField(field.items)"
        @input="(field.onChange) ? field.onChange($event) : 0"
        :disabled="getPropertyField(field.disabled)"
        dense
        required
        outlined
      ></v-select>
    </template>
    <template v-else-if="getPropertyField(field.type)=='columns_filter'">
      <v-data-table
        :key="field.key"
        v-model="_value"
        show-select
        :headers="field.headers"
        :item-key="field.item_key"
        :items="(field.items_key) ? getPropertyField(currentCommand[field.items_key]) : field.items"
        @input="(field.onChange) ? field.onChange($event) : ()=>{}"
        @click:row="field.onClickRow ? field.onClickRow($event) : ()=>{}"
        :disabled="getPropertyField(field.disabled)"
        :items-per-page="(field.items_key) ? getPropertyField(currentCommand[field.items_key]).length : field.items.length"
        class="vdf--hide-select mb-4 columns-filter"
        hide-default-footer
        dense
        required
        outlined
      >
        <template v-slot:item.source="{ item }">
          <span dark class="capitalize text--darken-3" :class="[ item.source==='right' ? 'warning--text' : 'primary--text' ]">
            {{ item.source }}
          </span>
        </template>
        <template v-slot:item.key="{ item }">
          <span
            @click.stop="field.selectKey ? field.selectKey(item) : ()=>{}"
            :style="{
              opacity: ((currentCommand.right_on===item.name && item.source==='right')||(currentCommand.left_on===item.name && item.source==='left')) ? 1 : 0.5
            }"
            style="cursor: pointer"
          >
            <v-icon>
              vpn_key
            </v-icon>
          </span>
        </template>
      </v-data-table>
    </template>
    <template v-else-if="getPropertyField(field.type)=='select-foreach'">
      <v-row :key="field.key" no-gutters class="foreach-label">
        <template v-for="(title, i) in currentCommand.columns">
          <v-col v-if="!field.noLabel" :key="i+'label'" class="col-12 col-sm-4 col-md-3 font-weight-bold pr-4 text-ellipsis" :title="title">
            {{title}}
          </v-col>
          <v-col :key="i" class="col-12 oci-input-container" :class="{'col-sm-8 col-md-9': !field.noLabel}">
            <v-select
              v-model="_value[i]"
              :key="field.key"
              :label="field.label===true ? title : field.label"
              :placeholder="field.placeholder===true ? title : field.placeholder"
              :items="(field.items_key) ? currentCommand[field.items_key] : field.items"
              dense
              required
              outlined
            ></v-select>
          </v-col>
        </template>
      </v-row>
    </template>
    <template v-else-if="getPropertyField(field.type)=='clusters'">
      <div :key="field.key" class="clusters-table-container" style="overflow-y: auto; min-heigth: 240px;">
        <div v-for="(cluster, i) in _value" :key="i+'label'" class="cluster" :class="{'disabled-cluster': !cluster.merge}" >
            <v-data-table
              flat
              depressed
              v-model="cluster.selected"
              :items="cluster.values"
              :headers="clusterHeaders"
              :sort-by="'count'"
              sort-desc
              disable-pagination
              item-key="value"
              dense
              show-select
              hide-default-footer
            >
            </v-data-table>
            <div class="cluster-info">
              {{`${cluster.values.length} value${(cluster.values.length!=1 ? 's' : '')}`}} · {{`${cluster.count} row${(cluster.count!=1 ? 's' : '')}`}}
            </div>
            <v-text-field
              v-model="cluster.replace"
              class="cluster-replace-field pt-2"
              :label="(field.label===true ? cluster.replace : field.label) || 'New cell value'"
              :placeholder="field.placeholder===true ? cluster.replace : field.placeholder"
              :disabled="false && !cluster.selected.length"
              @input="clusterFieldUpdated(cluster)"
              dense
              required
              outlined
            ></v-text-field>
        </div>
      </div>
    </template>
  </div>
</template>

<script>

import {
  // printError,
  // parseResponse,
  // debounce,
  // newName,
  // arrayJoin,
  // getOutputColsArgument,
  // escapeQuotes,
  // escapeQuotesOn,
  // namesToIndices
  getProperty
} from '@/utils/functions.js'


export default {

  props: {
    currentCommand: {
      required: true
    },
    command: {
      required: true
    },
    field: {
      required: true
    },
    value: {
      required: true
    },
    index: {
      default: undefined
    },
  },

  computed: {
    _value: {
      get () {
        return this.value
      },
      set (value) {
        this.$emit('update:value',value)
      }
    }
  },

  methods: {
    getProperty(pof, args = []) {
      return getProperty(pof, args)
    },
    getPropertyField(pof) {
      return getProperty(pof, [this.currentCommand, this.index])
    },
  }


}
</script>
