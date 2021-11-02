<template>
  <v-card>
    <FormDialog focus ref="formDialog"/>
    <v-btn v-if="isDialog" icon large color="black" @click="$emit('back')" class="title-button-left">
      <v-icon>mdi-arrow-left</v-icon>
    </v-btn>
    <v-card-title>
      Macros
      <v-spacer></v-spacer>
    </v-card-title>
    <v-data-table
      :items="tableItems"
      :headers="headers"
      :mobile-breakpoint="0"
      :options.sync="options"
      :server-items-length="total"
      class="macros-table manager-table clickable-table"
      :loading="loading"
      @click:row="rowClicked"
    >
      <template slot="no-data">
        No macros found
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
                    Rename
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
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
  </v-card>
</template>

<script>

import FormDialog from "@/components/FormDialog"


export default {

  components: {
    FormDialog
  },

  props: {
    isDialog: {
      default: false,
      type: Boolean
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
        { text: 'Macro', sortable: true, width: '8%', value: 'name' },
        { text: 'Operations', sortable: true, width: '6%', value: 'cellsLength'},
        // { text: 'Created', sortable: true, width: '6%', value: 'createdAt'},
        { text: '', sortable: false, width: '1%', value: 'menu'}
      ],

      options: {}
    }
  },

  methods: {

    async rowClicked (event) {
      this.$emit('click:macro', event);
    },

    fromForm (form) {
      return this.$refs.formDialog.fromForm(form)
    },

    async deleteElement (macro) {
      try {
        let id = macro._id
        let found = this.items.findIndex(w=>w._id === id)
        this.$delete(this.items, found)

        await this.$store.dispatch('request',{
          request: 'delete',
          path: `/macros/${id}`,
        })
        await this.updateElements()
      } catch (err) {
        console.error(err)
      }
    },

    async editElement (macro) {

      try {
        let values = await this.fromForm({
          text: 'Edit macro',
          fields: [
            {
              key: 'name',
              name: '',
              value: macro.name,
              props: {
                placeholder: macro.name,
                label: 'Name'
              }
            },
            // {
            //   key: 'description',
            //   is: 'v-textarea',
            //   name: '',
            //   value: macro.description,
            //   props: {
            //     placeholder: undefined,
            //     label: 'Description'
            //   }
            // },
          ]
        })

        await this.updateMacro(macro._id, values)

      } catch (err) {
        console.error(err)
      }

    },

    async updateMacro (id, payload) {
      if (!payload) {
        return false;
      }

      let found = this.items.findIndex(w=>w._id === id);
      let item = this.items[found];
      item.loading = true;
      item = {...item, ...payload};
      this.$set(this.items, found, item);

      await this.$store.dispatch('request',{
        request: 'put',
        path: `/macros/${id}`,
        payload: payload
      });

      await this.updateElements();
    },

    async duplicateElement (macro) {
      try {
         this.items.push({
          ...macro,
          name: macro.name+' copy',
          createdAt: false,
          updatedAt: false,
          loading: true,
          _id: false
        })
        await this.$store.dispatch('request',{
          request: 'post',
          path: `/macros/copy/${macro._id}`,
          payload: {
            name: macro.name+' copy' // TO-DO: copyName function
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
          path: `/macros?page=${page-1}&pageSize=${itemsPerPage}${sort}`
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
        name: w.name,
        cellsLength: (w.macro?.cells || []).length,
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
