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
      class="settings-table manager-table"
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
          >Create a new engine</v-btn>
      </template>
      <template v-slot:item.selectedSettings="{ item }">
        <span
          :class="{
            'primary--text': item.selectedSettings,
            'icon--text': !item.selectedSettings
          }"
          class="pl-3"
        >●</span>
      </template>
      <template v-slot:item.preferred="{ item }">
        <v-icon
          active-class="no-active"
          @click="!item.preferred && starElement(item)"
          :class="{
            'primary--text active': item.preferred,
            'icon--text': !item.preferred
          }"
          class="ml-3 preferred-star"
        >star</v-icon>
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
            <v-icon v-on="more" class="right-button" @click.stop="">more_vert</v-icon>
          </template>
          <v-list flat dense style="max-height: 400px; min-width: 160px;" class="scroll-y">
            <v-list-item-group color="black">
              <v-list-item
                @click="editElement(item)"
              >
                <v-list-item-content>
                  <v-list-item-title>
                    Edit engine
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
              <v-list-item
                @click="starElement(item)"
                v-if="preferred"
              >
                <v-list-item-content>
                  <v-list-item-title>
                    Set as preferred
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
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
                :disabled="item._id===highlight"
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
    preferred: {
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
      default: 'Engines'
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

    async rowClicked (setting) {
      this.$emit('click:engine',setting)
    },

    async deleteElement (setting) {
      try {
        var id = setting._id
        var found = this.items.findIndex(w=>w._id === id)
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

    requestItem (formValues) {
      var configuration = formValues;
      var name = formValues._ws_name;
      delete configuration._ws_name;
      delete configuration._event;
      return {name, configuration};
    },

    async createNewElementUsingForm () {
      var values = await this.settingsParameters()
      if (!values) {
        return false;
      }
      await this.createNewElement(values);
    },

    async starElement (item) {
      this.items = this.items.map(i=>{
        if (i._id==item._id) {
          i.preferred = true;
          i.loading = true;
        } else {
          i.preferred = false;
        }
        return i;
      });
      try {
        var response = await this.$store.dispatch('request',{
          request: 'put',
          path: '/workspacesettings/preferred',
          payload: {
            workspaceId: item._id
          }
        })
      } catch (err) {
        console.error(err)
      }
      await this.updateElements()


    },

    async createNewElement (values) {

      var pushed = -1;

      var payload = this.requestItem(values)

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
          path: '/workspacesettings',
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

    async editElement (setting) {

      if (setting._id === this.highlight && this.backEditHighlight) {
        this.$emit('back');
      } else {

        var params = {
          ...setting.configuration,
          _ws_name: setting.name
        }

        var values = await this.settingsParameters(params, 'Edit engine', true)

        if (!values) {
          return false
        }

        if (values._event === 'create') {

          this.createNewElement(values);

        } else {

          var {name, configuration} = this.requestItem(values)

          try {

            var id = setting._id

            var found = this.items.findIndex(w=>w._id === id)
            var item = this.items[found]
            item.loading = true
            item = {...item, name, configuration}
            this.$set(this.items, found, item)
            // this.$delete(this.items, found)

            await this.$store.dispatch('request',{
              request: 'put',
              path: `/workspacesettings/${id}`,
              payload: {configuration, name}
            })
            await this.updateElements()
          } catch (err) {
            console.error(err)
          }

        }


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
          path: `/workspacesettings?page=${page-1}&pageSize=${itemsPerPage}${sort}`
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
        { text: 'Name', sortable: true, width: '8%', value: 'name' },
        { text: 'Engine', sortable: true, width: '8%', value: 'engine' },
        { text: 'Gateway address', sortable: true, width: '8%', value: 'address' },
        { text: 'Workers', sortable: true, width: '8%', value: 'workers' },
        { text: 'Memory', sortable: true, width: '8%', value: 'memory' },
        { text: 'Last modification', sortable: true, width: '6%', value: 'updatedAt'},
        // { text: 'Created', sortable: true, width: '6%', value: 'createdAt'},
        { text: '', sortable: false, width: '1%', value: 'menu'}
      ];

      if (this.selecting) {
        h = [
          { text: 'Selected', sortable: true, width: '1%', value: 'selectedSettings', align: 'left' },
          ...h
        ]
      }

      if (this.preferred) {
        h = [
          { text: 'Preferred', sortable: true, width: '1%', value: 'preferred', align: 'left' },
          ...h
        ]
      }

      return h;
    },

    tableItems () {
      if (!this.items || !this.items.length) {
        return []
      }

      return this.items.map((e)=>{
        var c = e.configuration || {};
        if (c.jupyter_address && c.jupyter_address.ip && c.jupyter_address.port) {
          c.address = `${c.jupyter_address.ip}:${c.jupyter_address.port}`;
        }
        return {
          ...e,
          selectedSettings: e._id == this.highlight,
          name: e.name,
          engine: c.engine || 'default',
          address: c.address || 'default',
          workers: c.n_workers || 'N/A',
          memory: c.memory_limit || 'N/A',
          updatedAt: e.updatedAt,
          createdAt: e.createdAt
        }
      })
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
