<template>
  <v-card>
    <FormDialog focus ref="formDialog"/>
    <v-btn v-if="isDialog" icon large color="black" @click="$emit('back')" class="title-button-left">
      <v-icon>mdi-arrow-left</v-icon>
    </v-btn>
    <v-card-title>
      {{ title }}
    </v-card-title>
    <v-data-table
      :items="tableItems"
      :headers="headers"
      :mobile-breakpoint="0"
      :options.sync="options"
      :server-items-length="total"
      class="connections-table manager-table"
      :class="{'clickable-table': selecting}"
      :loading="loading"
      @click:row="rowClicked"
    >
      <template slot="no-data">
        <v-btn
            @click="createNewElementUsingForm()"
            color="primary"
            class="cto-no-data-button"
            depressed
          >Create new connection</v-btn>
      </template>
      <template v-slot:item.createdAt="{ item }">
        {{item.createdAt | formatDate}}
      </template>
      <template v-slot:item.updatedAt="{ item }">
        {{item.updatedAt | formatDate}}
      </template>
      <template v-slot:item.menu="{ item }">
        <v-progress-circular
          indeterminate
          color="#888"
          size="24"
          v-if="item.loading"
        />
        <v-menu
          v-else
          offset-y
          left
          min-width="200"
          :disabled="!item.id"
        >
          <!-- :search="search" -->
          <template v-slot:activator="{ on: more }">
            <v-icon v-on="more" class="right-button" @click.stop="">more_vert</v-icon>
          </template>
          <v-list flat dense style="max-height: 400px; min-width: 160px;" class="scroll-y">
            <v-list-item-group color="black">
              <v-list-item
                @click="editElement(item)"
              >
                <v-list-item-content>
                  <v-list-item-title>
                    Edit connection
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
              <v-list-item
                @click="deleteElement(item)"
                :disabled="item.id===highlight"
              >
                <v-list-item-content>
                  <v-list-item-title color="error">
                    Delete
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list-item-group>
          </v-list>
        </v-menu>
      </template>
    </v-data-table>
    <v-btn
      fab
      dark
      small
      color="primary"
      @click="createNewElementUsingForm()"
      style="top: calc(100% - 50px); position: absolute; left: 12px;"
    >
      <v-icon>add</v-icon>
    </v-btn>
  </v-card>
</template>

<script>

import FormDialog from "@/components/FormDialog"
import { capitalizeString, deepCopy, nameify, objectFilter, CONNECTION_TYPES, SOURCE_TYPES_PARAMS, DATABASE_TYPES, DATABASE_TYPES_FIELDS } from "bumblebee-utils";

export default {

  components: {
    FormDialog
  },

  props: {
    isDialog: {
      default: false,
      type: Boolean
    },
    selecting: {
      default: false,
      type: Boolean
    },
    highlight: {
      default: false
    },
    backEditHighlight: {
      default: false,
      type: Boolean
    },
    title: {
      type: String,
      default: 'Connections'
    }
  },

  data () {
    return {
      loading: false,
      total: undefined,
      items: [],
      // search: false,
      createName: '',
      form: {
        promise: false,
        text: false,
        label: false,
        value: false
      },
      options: {}
    }
  },

  methods: {

    async connectionsParameters (_defaultValues, text = 'Create new connection', editing = false, extraButtons = []) {

      var defaultValues = deepCopy(_defaultValues || {});

      var generatedFields = Object.entries(SOURCE_TYPES_PARAMS).filter(([key, field])=>field.type !== 'hidden' && !field.noForm).map(([key, field])=>{
        return {
          key,
          value: defaultValues[key] || (field.fill ? field.default : undefined),
          ...(field.items ? {is: 'v-select'} : {}),
          ...(field.type === 'boolean' ? {type: 'checkbox'} : {}),
          props: {
            placeholder: field.default,
            label: field.name || nameify(key),
            ...(field.type === 'int' && !field.items ? {type: 'number'} : {}),
            ...(field.items ? { items: Object.entries(field.items).map(([value, text])=>({ text, value })) } : {})
          },
          ...( field.types && field.condition ? { condition: (values) => field.condition(values) && field.types.includes(values.type) } : {} ),
          ...( field.types && !field.condition ? { condition: (values) => field.types.includes(values.type) } : {} ),
          ...( !field.types && field.condition ? { condition: (values) => field.condition(values) } : {} )
        }
      });

      var fields = [
        {
          key: 'type',
          is: 'v-select',
          value: defaultValues.type || 's3',
          props: {
            items: [
              ...Object.entries(CONNECTION_TYPES).map(([value, text])=>({value, text})),
              { divider: true },
              ...Object.entries(DATABASE_TYPES).map(([value, text])=>({value, text}))
            ],
            label: 'Type'
          }
        },
        ...generatedFields

      ];

      var values = await this.fromForm({
        acceptLabel: 'Save',
        extraButtons: editing ? [...extraButtons, {
          checkDisabled: true,
          label: 'Save as',
          event: 'create'
        }] : extraButtons,
        text,
        fields,
        disabled: (values) => {
          return false;
        }
      });

      if (values) {
        return objectFilter(values, ([key, value])=>{
          return value;
        });
      } else {
        return values;
      }

    },

    async rowClicked (connection) {
      this.$emit('click:connection',connection)
    },

    fromForm (form) {
      return this.$refs.formDialog.fromForm(form)
    },

    async deleteElement (connection) {
      try {
        var id = connection.id
        var found = this.items.findIndex(w=>w.id === id)
        this.$delete(this.items, found)

        await this.$store.dispatch('request',{
          request: 'delete',
          path: `/connections/${id}`,
        })
        await this.updateElements()
      } catch (err) {
        console.error(err)
      }
    },

    requestItem (formValues) {
      var configuration = formValues;
      var name = formValues._ws_name;
      delete configuration._ws_name;
      delete configuration._event;
      return {name, configuration};
    },

    async createNewElementUsingForm () {
      var values = await this.connectionsParameters()
      if (!values) {
        return false;
      }
      await this.createNewElement(values);
    },

    async createNewElement (values) {

      var pushed = -1;

      var payload = this.requestItem(values);

      pushed = this.items.push({
        name: payload.name,
        configuration: payload.configuration,
        createdAt: false,
        updatedAt: false,
        loading: true,
        _id: false
      });

      try {
        var response = await this.$store.dispatch('request',{
          request: 'post',
          path: '/connections',
          payload
        })
        await this.updateElements()
      } catch (err) {
        if (pushed>=0) {
          this.$delete(this.items, pushed-1)
        }
        console.error(err)
      }
    },

    async editElement (connection) {

      if (connection.id === this.highlight && this.backEditHighlight) {
        this.$emit('back');
      } else {

        var params = {
          ...connection.configuration,
          _ws_name: connection.name
        }

        var values = await this.connectionsParameters(params, 'Edit connection', true)

        if (!values) {
          return false
        }

        if (values._event === 'create') {

          this.createNewElement(values);

        } else {

          var {name, configuration} = this.requestItem(values)

          try {

            var id = connection.id

            var found = this.items.findIndex(w=>w.id === id)
            var item = this.items[found]
            item.loading = true
            item = {...item, name, configuration}
            this.$set(this.items, found, item)
            // this.$delete(this.items, found)

            await this.$store.dispatch('request',{
              request: 'put',
              path: `/connections/${id}`,
              payload: {configuration, name}
            })
            await this.updateElements()
          } catch (err) {
            console.error(err)
          }

        }


      }
    },

    async duplicateElement (connection) {
      try {
         this.items.push({
          ...connection,
          name: connection.name+' copy',
          createdAt: false,
          updatedAt: false,
          loading: true,
          _id: false
        })
        await this.$store.dispatch('request',{
          request: 'post',
          path: `/connections/copy/${connection.id}`,
          payload: {
            name: connection.name+' copy' // TO-DO: copyName function
          }
        })
        await this.updateElements()
      } catch (err) {
        console.error(err)
      }
    },

    async updateElements () {
      var {items, total} = await this.getElements()
      this.items = items
      this.total = total
    },

    async getElements () {
      try {
        this.loading = true;
        var { sortBy, sortDesc, page, itemsPerPage } = this.options;
        var sort = '';
        if (sortBy[0]) {
          var sort = sortBy[0];
          if (sortDesc[0]) {
            sort = '-'+sort;
          }
          sort = '&sort='+sort;
        }
        var response = await this.$store.dispatch('request',{
          path: `/connections?page=${page-1}&pageSize=${itemsPerPage}${sort}`
        });
        this.loading = false;
        return {items: response.data.items, total: response.data.count};
      } catch (err) {
        console.error(err);
      }
    }

  },

  computed: {

    headers () {
      var h = [
        { text: 'Type', sortable: true, width: '8%', value: 'type' },
        { text: 'Address', sortable: true, width: '8%', value: '_address' },
        { text: 'Last modification', sortable: true, width: '6%', value: 'updatedAt'},
        { text: 'Created', sortable: true, width: '6%', value: 'createdAt'},
        { text: '', sortable: false, width: '1%', value: 'menu'}
      ];

      return h;
    },

    tableItems () {
      if (!this.items || !this.items.length) {
        return []
      }

      return this.items.map((e)=>{
        var configuration = e.configuration || {}
        return {
          ...e,
          type: configuration.type,
          _address: configuration.url || configuration.endpoint_url || (configuration.host && configuration.port ? `${configuration.host}:${configuration.port}` : false) || configuration.host || 'N/A',
          updatedAt: e.updatedAt,
          createdAt: e.createdAt
        }
      })
    }
  },

  watch: {
    options: {
      deep: true,
      async handler () {
        this.updateElements()
      },
    },
  }
}
</script>
