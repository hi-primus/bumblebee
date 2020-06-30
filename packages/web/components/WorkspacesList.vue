<template>
  <v-card>
    <v-dialog
      v-if="form.promise"
      :value="form.promise"
      max-width="290"
      @click:outside="acceptForm(false)"
    >
      <v-form @submit.prevent="acceptForm(form.value)">
        <v-card>
          <v-card-title class="title">{{form.text}}</v-card-title>
          <v-card-text>
            <v-text-field
              ref="formInput"
              outlined
              dense
              :label="form.label"
              :placeholder="form.placeholder"
              v-model="form.value"
            />
          </v-card-text>
          <v-card-actions>
            <div class="flex-grow-1" />
            <v-btn color="primary" text @click="acceptForm(false)">Cancel</v-btn>
            <v-btn color="primary" text :disabled="!form.value" type="submit">Accept</v-btn>
          </v-card-actions>
        </v-card>
      </v-form>
    </v-dialog>
    <v-card-title>
      Workspaces
      <v-spacer></v-spacer>
      <v-form @submit.prevent="createNewWorkspace(createName)">
        <!-- class="append-no-ma" -->
        <v-text-field
          v-model="createName"
          label="New workspace"
          append-icon="add"
          @click:append="createNewWorkspace(createName)"
          outlined
          dense
          single-line
          hide-details
        >
          <!-- <template v-slot:append-outer>
            <v-btn type="submit" color="primary">
              <v-icon>add</v-icon>
            </v-btn>
          </template> -->
        </v-text-field>
      </v-form>
      <!-- <v-text-field
        v-model="search"
        append-icon="mdi-magnify"
        label="Search or create"
        single-line
        hide-details
      ></v-text-field> -->
    </v-card-title>
    <v-data-table
      :items="tableItems"
      :headers="headers"
      :mobile-breakpoint="0"
      :options.sync="options"
      :server-items-length="tableItems.length"
      class="workspaces-table"
      :loading="loading"
      @click:row="workspaceClicked"
    >
      <!-- class="columns-table" -->
      <template v-slot:item.active="{ item }">
        <span
          :class="{
            'primary--text': item.active,
            'grey--text': !item.active
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
                @click="renameWorkspace(item)"
              >
                <v-list-item-content>
                  <v-list-item-title>
                    Rename
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
              <v-list-item
                @click="duplicateWorkspace(item)"
              >
                <v-list-item-content>
                  <v-list-item-title>
                    Duplicate
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
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

import MoreMenu from "@/components/MoreMenu"

export default {

  components: {
    MoreMenu
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
        { text: 'Active', sortable: true, width: '1%', value: 'active', align: 'left' },
        { text: 'Workspace', sortable: true, width: '10%', value: 'name' },
        { text: 'Tabs', sortable: true, width: '5%', value: 'tabs' },
        { text: 'Data sources', sortable: true, width: '5%', value: 'dataSources' },
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

    fromForm (form) {
      this.form = form
      return new Promise((resolve, reject) => {
        this.form = { ...this.form, promise: {resolve, reject} }
      })
    },

    acceptForm (value) {
      try {
        console.log({...this.form})
        this.form.promise.resolve(value)
      } catch (err) {
        console.error(err)
      }
      this.form = {...this.form, promise: false}
    },

    async deleteWorkspace (workspace) {
      let id = workspace._id

      let found = this.items.findIndex(w=>w._id === id)
      // let item = this.items[found]
      // item.loading = true
      // item.deleting = true
      // this.$set(this.items, found, item)
      this.$delete(this.items, found)

      await this.$store.dispatch('request',{
        request: 'delete',
        path: `/workspaces/${id}`,
      })
      await this.updateWorkspaces()
    },

    async createNewWorkspaceUsingForm () {
      let input = await this.fromForm({
        name: '',
        placeholder: undefined,
        value: '',
        label: 'New workspace',
        text: 'Create new workspace'
      })

      await this.createNewWorkspace(input)
    },

    async createNewWorkspace (name) {
      if (!name) {
        return false
      }

      this.items.push({
        name: name,
        createdAt: false,
        updatedAt: false,
        loading: true,
        _id: false
      })
      await this.$store.dispatch('request',{
        request: 'post',
        path: '/workspaces',
        payload: {
          name: name
        }
      })
      await this.updateWorkspaces()
    },

    async renameWorkspace (workspace) {

      let input = await this.fromForm({
        name: workspace.name,
        placeholder: workspace.name,
        value: workspace.name,
        label: 'Rename',
        text: 'Rename workspace'
      })

      if (!input) {
        return false
      }

      let id = workspace._id

      let found = this.items.findIndex(w=>w._id === id)
      let item = this.items[found]
      item.loading = true
      item.name = input
      this.$set(this.items, found, item)
      // this.$delete(this.items, found)

      await this.$store.dispatch('request',{
        request: 'put',
        path: `/workspaces/${id}`,
        payload: {
          name: input
        }
      })
      await this.updateWorkspaces()
    },

    async duplicateWorkspace (workspace) {
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
        path: '/workspaces',
        payload: {
          name: workspace.name+' copy', // TO-DO: copyName
          // TO-DO: copy ok
          // connection: workspace.connection,
          // tabs: workspace.tabs,
          // dataSources: workspace.dataSources
        }
      })
      await this.updateWorkspaces()
    },

    async updateWorkspaces () {
      let {items, total} = await this.getWorkspaces()
      this.items = items
      this.total = total
    },

    async getWorkspaces () {
      this.loading = true
      let { sortBy, sortDesc, page, itemsPerPage } = this.options
      let response = await this.$store.dispatch('request',{
        path: `/workspaces`
      })
      console.log(response.data)
      this.loading = false
      return {items: response.data, total: 10} // TO-DO: this
    }

  },

  computed: {

    tableItems () {
      if (!this.items || !this.items.length) {
        return []
      }
      return this.items.map((w)=>({
        ...w,
        active: !(w.tabs || []).length, // TO-DO: Pedirle a edo
        name: w.name,
        tabs: (w.tabs || []).length,
        dataSources: (w.dataSources || []).length,
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
