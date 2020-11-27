<template>
  <v-card>
    <FormDialog :hide-overlay="isDialog" focus ref="formDialog"/>
    <v-btn v-if="selecting" icon large color="black" class="title-button-left">
      <v-icon>mdi-arrow-left</v-icon>
    </v-btn>
    <v-card-title>
      Settings
    </v-card-title>
    <v-data-table
      :items="tableItems"
      :headers="headers"
      :mobile-breakpoint="0"
      :options.sync="options"
      :server-items-length="total"
      class="settings-table manager-table"
      :class="{'clickable-table': selecting}"
      :loading="loading"
      @click:row="rowClicked"
    >
      <template slot="no-data">
        <div>No settings available</div>
      </template>
      <template v-slot:item.selectedSettings="{ item }">
        <span
          :class="{
            'primary--text': item.selectedSettings,
            'grey--text': !item.selectedSettings
          }"
          class="pl-3"
        >●</span>
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
          :disabled="!item._id"
        >
          <!-- :search="search" -->
          <template v-slot:activator="{ on: more }">
            <v-icon v-on="more" class="right-button" color="grey" @click.stop="">more_vert</v-icon>
          </template>
          <v-list flat dense style="max-height: 400px; min-width: 160px;" class="scroll-y">
            <v-list-item-group color="black">
              <!-- <v-list-item
                @click="editElement(item)"
              >
                <v-list-item-content>
                  <v-list-item-title>
                    Edit info
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item> -->
              <!-- <v-list-item
                @click="duplicateElement(item)"
              >
                <v-list-item-content>
                  <v-list-item-title>
                    Duplicate
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item> -->
              <v-list-item
                @click="deleteElement(item)"
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

import settingsMixin from "@/plugins/mixins/workspace-settings";

export default {

  mixins: [ settingsMixin ],

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
      headers: [
        { text: 'Selected', sortable: true, width: '1%', value: 'selectedSettings', align: 'left' },
        { text: 'Name', sortable: true, width: '8%', value: 'name' },
        { text: 'Engine', sortable: true, width: '8%', value: 'engine' },
        // { text: 'Description', sortable: true, width: '12%', value: 'description' },
        { text: 'Last modification', sortable: true, width: '6%', value: 'updatedAt'},
        { text: 'Created', sortable: true, width: '6%', value: 'createdAt'},
        { text: '', sortable: false, width: '1%', value: 'menu'}
      ],
      options: {}
    }
  },

  methods: {

    async rowClicked (setting) {
      this.$emit('click:setting',setting)
    },

    async deleteElement (setting) {
      try {
        let id = setting._id
        let found = this.items.findIndex(w=>w._id === id)
        this.$delete(this.items, found)

        await this.$store.dispatch('request',{
          request: 'delete',
          path: `/workspacesettings/${id}`,
        })
        await this.updateElements()
      } catch (err) {
        console.error(err)
      }
    },

    async createNewElementUsingForm () {
      let values = await this.settingsParameters()
      if (!values) {
        return false;
      }
      await this.createNewElement(values);
    },

    async createNewElement (configuration) {

      var pushed = -1;

      pushed = this.items.push({
        name: configuration.name,
        description: configuration.description,
        createdAt: false,
        updatedAt: false,
        loading: true,
        _id: false
      });

      var payload = { configuration };

      try {
        var response = await this.$store.dispatch('request',{
          request: 'post',
          path: '/workspacesettings',
          payload
        })
        console.log({response})
        await this.updateElements()
      } catch (err) {
        if (pushed>=0) {
          this.$delete(this.items, pushed-1)
        }
        console.error(err)
      }
    },

    async editElement (setting) {



      let values = await this.settingsParameters()

      try {
        let values = await this.fromForm({
          text: 'Edit setting',
          fields: [
            {
              name: '',
              value: setting.name,
              props: {
                placeholder: setting.name,
                label: 'Name'
              }
            },
            {
              is: 'v-textarea',
              name: '',
              value: setting.description,
              props: {
                placeholder: undefined,
                label: 'Description'
              }
            },
          ]
        })

        if (!values) {
          return false
        }

        let id = setting._id

        let found = this.items.findIndex(w=>w._id === id)
        let item = this.items[found]
        item.loading = true
        item = {...item, ...values}
        this.$set(this.items, found, item)
        // this.$delete(this.items, found)

        await this.$store.dispatch('request',{
          request: 'put',
          path: `/workspacesettings/${id}`,
          payload: values
        })
        await this.updateElements()
      } catch (err) {
        console.error(err)
      }

    },

    async duplicateElement (setting) {
      try {
         this.items.push({
          ...setting,
          name: setting.name+' copy',
          createdAt: false,
          updatedAt: false,
          loading: true,
          _id: false
        })
        await this.$store.dispatch('request',{
          request: 'post',
          path: `/workspacesettings/copy/${setting._id}`,
          payload: {
            name: setting.name+' copy' // TO-DO: copyName function
          }
        })
        await this.updateElements()
      } catch (err) {
        console.error(err)
      }
    },

    async updateElements () {
      let {items, total} = await this.getElements()
      this.items = items
      this.total = total
    },

    async getElements () {
      try {
        this.loading = true
        let { sortBy, sortDesc, page, itemsPerPage } = this.options
        let sort = ''
        if (sortBy[0]) {
          let sort = sortBy[0]
          if (sortDesc[0]) {
            sort = '-'+sort
          }
          sort = '&sort='+sort
        }
        let response = await this.$store.dispatch('request',{
          path: `/workspacesettings`
        })
        console.log({response});
        this.loading = false
        return {items: response.data.items, total: response.data.count}
      } catch (err) {
        console.error(err)
      }
    }

  },

  computed: {

    value () {
      console.log('comparing?', this.highlight, this.tableItems);
      if (this.highlight) {
        var found = this.tableItems.find(e=>{
          console.log('comparing', e._id, this.highlight);
          return (e._id==this.highlight)
        })
        if (found) {
          return [found];
        }
      }
      return [];
    },

    tableItems () {
      if (!this.items || !this.items.length) {
        return []
      }
      console.log(this.items);
      return this.items.map((e)=>({
        ...e,
        selectedSettings: e._id == this.highlight,
        name: e.name,
        engine: e.configuration ? e.configuration.engine : 'default',
        updatedAt: e.updatedAt,
        createdAt: e.createdAt
      }))
    }
  },

  watch: {
    total: {
      immediate: true,
      handler (total) {
        this.$emit('update:total', total)
      }
    },
    options: {
      deep: true,
      async handler () {
        this.updateElements()
      },
    },
  }
}
</script>
