<template>
  <div class="o-field" :class="field.class || {}">
    <template v-if="getPropertyField(field.type)==='action'">
      <v-btn
        :key="field.key"
        :id="'field-'+field.key"
        depressed
        color="primary"
        @click="triggerFunction(field.func, $event)"
        class="mb-6 mx-a d-flex"
        :loading="currentCommand[field.loading]"
        :disabled="!currentCommand[field.loading] && field.validate && !field.validate(currentCommand)"
      >
        {{
          {value: field.label, args: [currentCommand]} | property
        }}
        <template v-slot:loader>
          <v-progress-circular
            :indeterminate="!currentCommand[field.loadingProgress]"
            size="24"
            width="2"
            :value="currentCommand[field.loadingProgress]"
          ></v-progress-circular>
        </template>
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
        :id="'field-'+field.key"
        :label="(typeof field.label == 'function') ? field.label(currentCommand) : (field.label || '')"
        :placeholder="(typeof field.placeholder == 'function') ? field.placeholder(currentCommand) : (field.placeholder || '')"
        :clearable="field.clearable"
        :accept="field.accept"
        @change="triggerFunction(field.onChange, $event)"
        @click:clear="triggerFunction(field.onClear, $event)"
        dense
        required
        outlined
      ></v-file-input>
    </template>
    <template v-else-if="getPropertyField(field.type)=='field'">
      <v-text-field
        v-model="_value"
        :key="field.key"
        :id="'field-'+field.key"
        :autocomplete="getPropertyField(field.autocomplete) || 'off'"
        :label="getPropertyField(field.label)"
        :placeholder="(typeof field.placeholder == 'function') ? field.placeholder(currentCommand) : (field.placeholder || '')"
        :clearable="field.clearable"
        :class="{'mono-field': field.mono}"
        @input="triggerFunction(field.onChange, $event)"
        spellcheck="false"
        dense
        required
        outlined
      ></v-text-field>
    </template>
    <template v-else-if="getPropertyField(field.type)=='text-area'">
      <v-textarea
        v-model="_value"
        :key="field.key"
        :id="'field-'+field.key"
        :autocomplete="getPropertyField(field.autocomplete) || 'off'"
        :label="getPropertyField(field.label)"
        :placeholder="(typeof field.placeholder == 'function') ? field.placeholder(currentCommand) : (field.placeholder || '')"
        :clearable="field.clearable"
        :class="{'mono-field': field.mono}"
        :heigth="field.height || 'auto'"
        :style="{'height': field.height || 'auto'}"
        @input="triggerFunction(field.onChange, $event)"
        spellcheck="false"
        dense
        required
        outlined
      ></v-textarea>
    </template>
    <template v-else-if="getPropertyField(field.type)=='code-editor'">
      <AceEditor
        v-model="_value"
        :key="field.key+'ace-editor'"
        :id="'field-'+field.key"
        @input="triggerFunction(field.onChange, $event)"
        @selection="triggerFunction(field.onSelection, $event)"
        :height="field.height || '200px'"
        width="100%"
        :label="getPropertyField(field.label)"
        lang="python"
        :options="{
          highlightActiveLine: true,
          showLineNumbers: true,
          tabSize: 4,
          showPrintMargin: false,
          showGutter: false,
        }"
      />
    </template>
    <template v-else-if="getPropertyField(field.type)=='debug-value'">
      <template
      >
        <div
          v-if="_value && _value.source"
          :key="field.key+(_value ? _value.source : '')"
          class="debug-value"
          :class="{'debug-value-error': _value.error}"
          :id="'field-'+field.key+(_value ? _value.source : '')"
        >{{_value.source}}:<br/>{{_value.result}}</div>
        <div
          v-else
          :key="'e'+field.key+(_value ? _value.source : '')"
          class="hidden-error"
        >
          {{_value}}
        </div>
      </template>
    </template>
    <template v-else-if="getPropertyField(field.type)=='field-suggestions'">
      <TextFieldSuggestions
        v-model="_value"
        :key="field.key+'tfs'"
        :id="'field-'+field.key"
        :label="getPropertyField(field.label)"
        :placeholder="(typeof field.placeholder == 'function') ? field.placeholder(currentCommand) : (field.placeholder || '')"
        :clearable="field.clearable"
        :mono="field.mono"
        :suggestions="getPropertyField(field.suggestions)"
        @input="triggerFunction(field.onChange, $event)"
        :suggest-on-empty="Object.keys(getPropertyField(field.suggestions))[0]"
        :use-functions="getPropertyField(field.useFunctions)"
        :fuzzy-search="getPropertyField(field.fuzzySearch)"
      ></TextFieldSuggestions>
    </template>
    <template v-else-if="getPropertyField(field.type)=='chips'">
      <v-combobox
        v-model="_value"
        :key="field.key"
        :id="'field-'+field.key"
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
        :id="'field-'+field.key"
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
        :id="'field-autocomplete-'+field.key"
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
        :id="'field-'+field.key"
        v-if="currentCommand[field.key]"
        :data="currentCommand[field.key]"
        :columnName="currentCommand.columns[0]"
        :selection.sync="currentCommand[field.selection_key]"
      />
    </template>
    <template v-else-if="getPropertyField(field.type)=='switch'">
      <v-switch
        :key="field.key"
        :id="'field-'+field.key"
        v-model="_value"
        color="primary"
        :label="(typeof field.label == 'function') ? field.label(currentCommand) : field.label"
      ></v-switch>
    </template>
    <template v-else-if="getPropertyField(field.type)=='password'">
      <v-text-field
        v-model="_value"
        :key="field.key"
        :id="'field-'+field.key"
        :label="field.label"
        :placeholder="field.placeholder"
        dense
        required
        outlined
        spellcheck="false"
        :append-icon="field.showable ? (field.show ? 'visibility' : 'visibility_off') : undefined"
        :type="(field.show || !field.showable) ? 'text' : 'password'"
        :clearable="field.clearable"
        @input="triggerFunction(field.onChange, $event)"
        @click:append="field.show = !field.show"
      />
    </template>
    <template v-else-if="getPropertyField(field.type)=='number'">
      <v-text-field
        type="number"
        v-model="_value"
        :key="field.key"
        :id="'field-'+field.key"
        :label="field.label"
        :placeholder="field.placeholder"
        :min="field.min"
        :clearable="field.clearable"
        @input="triggerFunction(field.onChange, $event)"
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
        :id="'field-'+field.key"
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
        :id="'field-'+field.key"
        v-model="_value"
        :label="field.label"
        :placeholder="field.placeholder"
        :items="(field.items_key) ? getPropertyField(currentCommand[field.items_key]) : getPropertyField(field.items)"
        @input="triggerFunction(field.onChange, $event)"
        :disabled="getPropertyField(field.disabled)"
        dense
        required
        outlined
      >
        <template v-slot:item="{ item, on, attrs }">
          <v-list-item  :data-value="item.value || item" v-on="on" v-bind="attrs">
            <v-list-item-content>
              <v-list-item-title>
                {{item.text || item.value || item}}
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </template>
      </v-select>
    </template>
    <template v-else-if="getPropertyField(field.type)=='connection'">
      <ConnectionsItemsField
        :key="field.key"
        :id="'field-'+field.key"
        v-model="_value"
        :field="field"
        @input="triggerFunction(field.onChange, $event)"
        @showConnections="$emit('showConnections', $event)"
      />
    </template>

    <template v-else-if="getPropertyField(field.type)=='columns_concat'">
      <div style="min-height: 80px; height: 94%; top: 0;" class="progress-middle" :key="field.key" v-if="!currentCommand.typesDone">
        <v-progress-circular
          indeterminate
          color="grey"
          class="mx-auto mt-4 d-flex"
          size="64"
          width="4"
        />
      </div>
      <ColumnsConcatSelector
        v-else
        :key="field.key"
        :id="'field-'+field.key"
        v-model="_value"
        :dataset-columns="getPropertyField(currentCommand.dataset_columns)"
        @input="triggerFunction(field.onChange, $event)"
      />
    </template>

    <template v-else-if="getPropertyField(field.type)=='columns_filter'">
      <ColumnsJoinSelector
        :key="field.key"
        :id="'field-'+field.key"
        v-model="_value"
        :headers="field.headers"
        :item-key="field.item_key"
        :items="(field.items_key) ? getPropertyField(currentCommand[field.items_key]) : field.items"
        :disabled="getPropertyField(field.disabled)"
        :right-on="currentCommand.right_on"
        :left-on="currentCommand.left_on"
        @input="triggerFunction(field.onChange, $event)"
        @click:row="triggerFunction(field.onClickRow, $event)"
        @click:item="triggerFunction(field.selectKey, $event)"
      >
      </ColumnsJoinSelector>
    </template>
    <template v-else-if="getPropertyField(field.type)=='table'">
      <ItemsSelector
        :key="field.key"
        :id="'field-'+field.key"
        v-model="_value"
        :headers="field.headers"
        :item-key="field.item_key"
        :items="(field.items_key) ? getPropertyField(currentCommand[field.items_key]) : field.items"
        :disabled="getPropertyField(field.disabled)"
        @input="triggerFunction(field.onChange, $event)"
        @click:row="triggerFunction(field.onClickRow, $event)"
      >
      </ItemsSelector>
    </template>
    <template v-else-if="getPropertyField(field.type)=='tabs'">
      <TitleTabs
        :key="field.key"
        :id="'field-'+field.key"
        v-model="_value"
        :concat="field.options.concat"
        :items-name="field.options.items_name"
        :item-key="field.item_key"
        :items="(field.items_key) ? getPropertyField(currentCommand[field.items_key]) : field.items"
        :static-items="(field.static_items_key) ? getPropertyField(currentCommand[field.static_items_key]) : field.static_items_key"
      >
      </TitleTabs>
      <div class="tab-hints" :id="'field-tabs-'+field.key" :key="'concat'+field.key">
        <template v-for="(item, index) in (field.info_key) ? getPropertyField(currentCommand[field.info_key]) : field.info || []" class="tab-info">
          <div :key="index"  class="tab-hint">
            <template v-if="item">
              {{item}}
            </template>
          </div>
        </template>
        <div class="tab-hint output-tab-hint" v-if="currentCommand.selected_columns && currentCommand.selected_columns.length" >
          {{currentCommand.selected_columns.length}} columns
        </div>
      </div>
    </template>
    <template v-else-if="getPropertyField(field.type)=='select-foreach'">
      <v-row :key="field.key" :id="'field-select-'+field.key" no-gutters class="foreach-label">
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
      <div :key="field.key" :id="'field-'+field.key" class="clusters-table-container" style="overflow-y: auto; min-heigth: 240px;">
        <div v-for="(cluster, i) in _value" :key="i+'label'" class="cluster" :class="{'disabled-cluster': !cluster.merge}" >
            <!-- { text: 'Rows', value: 'count', sortable: false, class: 'rows-count' }, -->
            <v-data-table
              flat
              depressed
              v-model="cluster.selected"
              :items="cluster.values"
              :headers="[
                { text: cluster.cluster_name, value: 'value', sortable: false },
              ]"
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
              spellcheck="false"
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

import { getProperty, debounce, throttle } from 'bumblebee-utils'

import TextFieldSuggestions from '@/components/TextFieldSuggestions'
import AceEditor from '@/components/AceEditor'
import ColumnsJoinSelector from '@/components/ColumnsJoinSelector'
import ItemsSelector from '@/components/ItemsSelector'
import TitleTabs from '@/components/TitleTabs'
import ColumnsConcatSelector from '@/components/ColumnsConcatSelector'
import ConnectionsItemsField from '@/components/ConnectionsItemsField'

import { mapGetters } from 'vuex'

export default {

  components: {
    TextFieldSuggestions,
    ColumnsJoinSelector,
    ItemsSelector,
    TitleTabs,
    ColumnsConcatSelector,
    ConnectionsItemsField,
    AceEditor
  },

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
    commandMethods: {
      required: false
    }
  },

  computed: {

    _value: {
      get () {
        return this.value
      },
      set (value) {
        this.$emit('update:value',value)
      }
    },

    computedCurrentCommand: {
      get () {
        return this.currentCommand;
      },
      set (c) {
        this.$emit('update:currentCommand', c);
      }
    }
  },

  methods: {

    getProperty,

    getPropertyField(pof) {
      return getProperty(pof, [this.currentCommand, this.index, this])
    },

    async triggerFunction (keyCallback, event) {

      let func = false;
      let debounceFunc = false;
      let throttleFunc = false;

      if (keyCallback && typeof keyCallback === 'object') {
        debounceFunc = keyCallback.debounce;
        throttleFunc = keyCallback.throttle;
        keyCallback = keyCallback.callback || keyCallback.key;
      }

      if (typeof keyCallback === 'function') {
        func = keyCallback
      } else if (keyCallback in this.command && typeof this.command[keyCallback] === 'function') {
        func = this.command[keyCallback]
      }

      if (func) {

        this.computedCurrentCommand._loading = true;

        let trueFunc = async function () {
          try {
            let result = await func(event, this.computedCurrentCommand, this.commandMethods || {}, this.command);
            console.log({result});
            if (result) {
              this.computedCurrentCommand = result;
            }
          } catch (err) {
            console.error(err);
          }
          this.computedCurrentCommand._loading = false;
        };

        trueFunc = trueFunc.bind(this);

        if (debounceFunc) {
          trueFunc = debounce(trueFunc, debounceFunc);
        }

        if (throttleFunc) {
          trueFunc = throttle(trueFunc, throttleFunc);
        }

        trueFunc();

      }
    },

    clusterFieldUpdated(cluster) {
      if (cluster.selected.length==0) {
        cluster.selected = cluster.values
      }
    },
  }


}
</script>
