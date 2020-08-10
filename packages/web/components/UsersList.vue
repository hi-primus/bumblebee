<template>
  <v-card>
    <FormDialog ref="formDialog"/>
    <v-card-title>
      Users
      <v-spacer></v-spacer>
      <v-text-field
        v-model="search"
        label="Search"
        append-icon="mdi-magnify"
        outlined
        dense
        single-line
        hide-details
      ></v-text-field>
    </v-card-title>
    <v-data-table
      :items="tableItems"
      :headers="headers"
      :mobile-breakpoint="0"
      :options.sync="options"
      :server-items-length="total"
      item-key="_id"
      v-model="selected"
      show-select
      class="users-table manager-table"
      :loading="loading"
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
                @click="editUser(item)"
              >
                <v-list-item-content>
                  <v-list-item-title>
                    Edit user info
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
              <v-list-item
                @click="deleteUser(item)"
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
      @click="activateSelected()"
      v-show="selected.length"
      style="top: calc(100% - 50px); position: absolute; left: 12px;"
    >
      <v-icon v-if="willActivate">check</v-icon>
      <v-icon v-else>close</v-icon>
    </v-btn>
  </v-card>
</template>

<script>

import FormDialog from "@/components/FormDialog"
import { debounce, throttle } from 'bumblebee-utils'

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
      search: '',
      selected: [],
      headers: [
        { value: 'data-table-select', width: '1%'},
        { text: 'Active', sortable: true, width: '1%', value: 'active', align: 'left' },
        { text: 'Username', sortable: true, width: '8%', value: 'username' },
        { text: 'E-mail', sortable: true, width: '8%', value: 'email' },
        { text: 'Last modification', sortable: true, width: '6%', value: 'updatedAt'},
        { text: 'Created', sortable: true, width: '6%', value: 'createdAt'},
        { text: '', sortable: false, width: '1%', value: 'menu'}
      ],
      options: {}
    }
  },

  methods: {

    async fromForm (form) {
      return await this.$refs.formDialog.fromForm(form)
    },

    async deleteUser (user) {
      try {
        let id = user._id

        let found = this.items.findIndex(w=>w._id === id)
        this.$delete(this.items, found)

        await this.$store.dispatch('request',{
          request: 'delete',
          path: `/users/${id}`,
        })
        await this.updateUsers()
      } catch (err) {
        console.error(err)
      }
    },

    async activateSelected () {
      var activate = this.willActivate
      var users = this.selected.map(u=>u._id).join(',')
      var response = await this.$store.dispatch('request',{
        request: 'post',
        path: `/users/${activate ? 'activate' : 'deactivate'}`,
        payload: {
          users
        }
      })
      await this.updateUsers()
      this.selected = []

    },

    async editUser (user) {

      try {
        let form = await this.fromForm({
          text: 'Edit user',
          fields: [
            {
              checkbox: true,
              value: user.active,
              label: 'Active'
            },
            {
              name: '',
              placeholder: user.username,
              value: user.username,
              label: 'Username'
            },
            {
              name: '',
              placeholder: user.email,
              value: user.email,
              label: 'E-mail'
            },
          ]
        })

        if (!form) {
          return false
        }

        var payload = {
          active: form.fields[0].value,
          username: form.fields[1].value,
          email: form.fields[2].value
        }

        let id = user._id

        let found = this.items.findIndex(w=>w._id === id)
        let item = this.items[found]
        item.loading = true
        item = {...item, ...payload}
        this.$set(this.items, found, item)

        await this.$store.dispatch('request',{
          request: 'put',
          path: `/users/${id}`,
          payload
        })
        await this.updateUsers()
      } catch (err) {
        console.error(err)
      }

    },

    async updateUsers () {
      let {items, total} = await this.getUsers()
      this.items = items
      this.total = total
    },

    async getUsers () {
      try {
        this.loading = true
        let { sortBy, sortDesc, page, itemsPerPage } = this.options
        let sort = ''
        if (sortBy[0]) {
          sort = sortBy[0]
          if (sortDesc[0]) {
            sort = '-'+sort
          }
          sort = '&sort='+sort
        }
        let search = this.search ? `&filters=username,email&values=${this.search},${this.search}` : ''
        let response = await this.$store.dispatch('request',{
          path: `/users?page=${page-1}&pageSize=${itemsPerPage}${sort}${search}`
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
        updatedAt: w.updatedAt,
        createdAt: w.createdAt
      }))
    },

    willActivate () {
      if (this.selected.length) {
        return this.selected.some(u=>!u.active)
      }
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
        this.updateUsers()
      },
    },
    search: throttle( function () {
      this.updateUsers()
    }, 100 )
  }
}
</script>
