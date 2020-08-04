<template>
  <v-card>
    <FormDialog ref="formDialog"/>
    <v-card-title>
      Workspaces
      <v-spacer></v-spacer>
      <v-form @submit.prevent="createNewWorkspace({name: createName})">
        <v-text-field
          v-model="createName"
          label="New workspace"
          append-icon="add"
          @click:append="createNewWorkspace({name: createName})"
          outlined
          dense
          single-line
          hide-details
        >
        </v-text-field>
      </v-form>
      <!-- <v-text-field
        v-model="search"
        append-icon="mdi-magnify"
        label="Search"
        single-line
        hide-details
      ></v-text-field> -->
    </v-card-title>
    <v-data-table
      :items="tableItems"
      :headers="headers"
      :mobile-breakpoint="0"
      :options.sync="options"
      :server-items-length="total"
      class="workspaces-table manager-table"
      :loading="loading"
      @click:row="workspaceClicked"
    >
      <!-- class="columns-table" -->
      <template v-slot:item.activeKernel="{ item }">
        <span
          :class="{
            'primary--text': item.activeKernel,
            'grey--text': !item.activeKernel
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
              <v-list-item
                @click="editWorkspace(item)"
              >
                <v-list-item-content>
                  <v-list-item-title>
                    Edit info
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
              <!-- <v-list-item
                @click="duplicateWorkspace(item)"
              >
                <v-list-item-content>
                  <v-list-item-title>
                    Duplicate
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item> -->
              <v-list-item
                @click="deleteWorkspace(item)"
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
      @click="createNewWorkspaceUsingForm()"
      style="top: calc(100% - 50px); position: absolute; left: 12px;"
    >
      <v-icon>add</v-icon>
    </v-btn>
  </v-card>
</template>

<script>

import FormDialog from "@/components/FormDialog"

export default {

  components: {
    FormDialog
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
        { text: 'Active', sortable: true, width: '1%', value: 'activeKernel', align: 'left' },
        { text: 'Workspace', sortable: true, width: '8%', value: 'name' },
        { text: 'Description', sortable: true, width: '12%', value: 'description' },
        { text: 'Tabs', sortable: true, width: '2%', value: 'tabs' },
        { text: 'Data sources', sortable: true, width: '2%', value: 'dataSourcesCount' },
        { text: 'Last modification', sortable: true, width: '6%', value: 'updatedAt'},
        { text: 'Created', sortable: true, width: '6%', value: 'createdAt'},
        { text: '', sortable: false, width: '1%', value: 'menu'}
      ],
      options: {}
    }
  },

  methods: {

    workspaceClicked (workspace) {
      if (this.$route.params.slug !== workspace._id) {
        this.$store.dispatch('session/cleanSession')
        this.$router.push({path: `/workspaces/${workspace._id}`, query: this.$route.query }) // TO-DO: slug
      }
      this.$emit('click:workspace',event)
    },

    async fromForm (form) {
      return await this.$refs.formDialog.fromForm(form)
    },

    async deleteWorkspace (workspace) {
      try {
        let id = workspace._id
        let found = this.items.findIndex(w=>w._id === id)
        this.$delete(this.items, found)

        await this.$store.dispatch('request',{
          request: 'delete',
          path: `/workspaces/${id}`,
        })
        await this.updateWorkspaces()
      } catch (err) {
        console.error(err)
      }
    },

    async createNewWorkspaceUsingForm () {
      let form = await this.fromForm({
        text: 'Create new workspace',
        fields: [
          {
            name: '',
            placeholder: undefined,
            value: '',
            label: 'New workspace'
          },
          {
            textarea: true,
            name: '',
            placeholder: undefined,
            value: '',
            label: 'Description'
          },
        ]
      })

      if (!form) {
        return false
      }

      var payload = {
        name: form.fields[0].value,
        description: form.fields[1].value
      }

      await this.createNewWorkspace(payload)
    },

    async createNewWorkspace (payload) {
      try {
        if (!payload.name) {
          return false
        }
        this.items.push({
          name: payload.name,
          description: payload.description,
          createdAt: false,
          updatedAt: false,
          loading: true,
          _id: false
        })
        await this.$store.dispatch('request',{
          request: 'post',
          path: '/workspaces',
          payload
        })
        await this.updateWorkspaces()
      } catch (err) {
        console.error(err)
      }
    },

    async editWorkspace (workspace) {

      try {
        let form = await this.fromForm({
          text: 'Edit workspace',
          fields: [
            {
              name: '',
              placeholder: workspace.name,
              value: workspace.name,
              label: 'Name'
            },
            {
              textarea: true,
              name: '',
              placeholder: undefined,
              value: workspace.description,
              label: 'Description'
            },
          ]
        })

        if (!form) {
          return false
        }

        var payload = {
          name: form.fields[0].value,
          description: form.fields[1].value
        }

        let id = workspace._id

        let found = this.items.findIndex(w=>w._id === id)
        let item = this.items[found]
        item.loading = true
        item = {...item, ...payload}
        this.$set(this.items, found, item)
        // this.$delete(this.items, found)

        await this.$store.dispatch('request',{
          request: 'put',
          path: `/workspaces/${id}`,
          payload
        })
        await this.updateWorkspaces()
      } catch (err) {
        console.error(err)
      }

    },

    async duplicateWorkspace (workspace) {
      try {
         this.items.push({
          ...workspace,
          name: workspace.name+' copy',
          createdAt: false,
          updatedAt: false,
          loading: true,
          _id: false
        })
        await this.$store.dispatch('request',{
          request: 'post',
          path: `/workspaces/copy/${workspace._id}`,
          payload: {
            name: workspace.name+' copy' // TO-DO: copyName function
          }
        })
        await this.updateWorkspaces()
      } catch (err) {
        console.error(err)
      }
    },

    async updateWorkspaces () {
      let {items, total} = await this.getWorkspaces()
      this.items = items
      this.total = total
    },

    async getWorkspaces () {
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
          path: `/workspaces?page=${page-1}&pageSize=${itemsPerPage}${sort}`
        })
        this.loading = false
        return {items: response.data.items, total: response.data.count}
      } catch (err) {
        console.error(err)
      }
    }

  },

  computed: {

    tableItems () {
      if (!this.items || !this.items.length) {
        return []
      }
      return this.items.map((w)=>({
        ...w,
        activeKernel: w.activeKernel,
        name: w.name,
        tabs: (w.tabs || []).length,
        dataSourcesCount: w.dataSourcesCount || 0,
        updatedAt: w.updatedAt,
        createdAt: w.createdAt
      }))
    }
  },

  watch: {
    form: {
      deep: true,
      handler (form) {
        if (form.promise) {
          setTimeout(()=>{
            var ref = this.$refs.formInput
            if (ref && ref.$el) {
              var el = ref.$el.getElementsByTagName('input')[0]
              if (el) {
                el.focus()
              }
            }
          }, 100)
        }
      }
    },
    total: {
      immediate: true,
      handler (total) {
        this.$emit('update:total', total)
      }
    },
    options: {
      deep: true,
      async handler () {
        this.updateWorkspaces()
      },
    },
  }
}
</script>
