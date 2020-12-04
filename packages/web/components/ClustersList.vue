<template>
  <v-card>
    <FormDialog focus ref="formDialog"/>
    <v-card-title>
      Clusters
      <v-spacer></v-spacer>
      <v-form @submit.prevent="createNewElement({name: createName})">
        <v-text-field
          v-model="createName"
          label="New cluster"
          append-icon="add"
          @click:append="createNewElement({name: createName})"
          outlined
          dense
          single-line
          hide-details
        >
        </v-text-field>
      </v-form>
    </v-card-title>
    <v-data-table
      :items="tableItems"
      :headers="headers"
      :mobile-breakpoint="0"
      :options.sync="options"
      :server-items-length="total"
      class="clusters-table manager-table"
      :loading="loading"
      @click:row="rowClicked"
    >
      <template v-slot:item.activeKernel="{ item }">
        <span
          :class="{
            'primary--text': item.activeKernel
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
            <v-icon v-on="more" class="right-button" @click.stop="">more_vert</v-icon>
          </template>
          <v-list flat dense style="max-height: 400px; min-width: 160px;" class="scroll-y">
            <v-list-item-group color="black">
              <v-list-item
                @click="editElement(item)"
              >
                <v-list-item-content>
                  <v-list-item-title>
                    Edit info
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
        { text: 'Cluster', sortable: true, width: '8%', value: 'name' },
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

    async rowClicked (cluster) {
      // openMenu
      this.$emit('click:cluster',cluster)
    },

    fromForm (form) {
      return this.$refs.formDialog.fromForm(form)
    },

    async deleteElement (cluster) {
      try {
        let id = cluster._id
        let found = this.items.findIndex(w=>w._id === id)
        this.$delete(this.items, found)

        await this.$store.dispatch('request',{
          request: 'delete',
          path: `/clusters/${id}`,
        })
        await this.updateElements()
      } catch (err) {
        console.error(err)
      }
    },

    async createNewElementUsingForm () {
      let values = await this.fromForm({
        text: 'Add a cluster',
        fields: [
          {
            key: 'name',
            name: '',
            placeholder: undefined,
            value: '',
            label: 'Cluster name'
          },
          {
            key: 'description',
            is: 'v-textarea',
            name: '',
            placeholder: undefined,
            value: '',
            label: 'Description'
          },
        ]
      })

      if (!values) {
        return false
      }

      await this.createNewElement(values)
    },

    async createNewElement (payload) {
      var pushed = -1
      if (!payload.name) {
        return false
      }
      pushed = this.items.push({
        name: payload.name,
        description: payload.description,
        createdAt: false,
        updatedAt: false,
        loading: true,
        _id: false
      })
      try {
        await this.$store.dispatch('request',{
          request: 'post',
          path: '/clusters',
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

    async editElement (cluster) {

      try {
        let values = await this.fromForm({
          text: 'Edit cluster',
          fields: [
            {
              key: 'name',
              name: '',
              value: cluster.name,
              props: {
                placeholder: cluster.name,
                label: 'Name'
              }
            },
            {
              key: 'description',
              is: 'v-textarea',
              name: '',
              value: cluster.description,
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

        let id = cluster._id

        let found = this.items.findIndex(w=>w._id === id)
        let item = this.items[found]
        item.loading = true
        item = {...item, ...values}
        this.$set(this.items, found, item)
        // this.$delete(this.items, found)

        await this.$store.dispatch('request',{
          request: 'put',
          path: `/clusters/${id}`,
          payload: values
        })
        await this.updateElements()
      } catch (err) {
        console.error(err)
      }

    },

    async duplicateElement (cluster) {
      try {
         this.items.push({
          ...cluster,
          name: cluster.name+' copy',
          createdAt: false,
          updatedAt: false,
          loading: true,
          _id: false
        })
        await this.$store.dispatch('request',{
          request: 'post',
          path: `/clusters/copy/${cluster._id}`,
          payload: {
            name: cluster.name+' copy' // TO-DO: copyName function
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
          path: `/clusters?page=${page-1}&pageSize=${itemsPerPage}${sort}`
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
