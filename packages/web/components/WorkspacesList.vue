<template>
  <v-data-table
    :items="items"
    :headers="workspacesHeaders"
    :mobile-breakpoint="0"
    @click:row="workspaceClicked"
  >
    <!-- class="columns-table" -->
    <template v-slot:item.active="{ item }">
      <span
        :class="{
          'primary--text': item.active,
          'grey--text': !item.active
        }"
      >
        ●
      </span>
    </template>
    <template v-slot:item.createdAt="{ item }">
      {{item.createdAt | formatDate}}
    </template>
    <template v-slot:item.updatedAt="{ item }">
      {{item.updatedAt | formatDate}}
    </template>

  </v-data-table>
</template>

<script>

export default {

  props: {
    workspaces: {
      type: Array
    }
  },

  data () {
    return {
      workspacesHeaders: [
        { text: 'Active', sortable: true, width: '1%', value: 'active' },
        { text: 'Workspace', sortable: true, width: '10%', value: 'name' },
        { text: 'Tabs', sortable: true, width: '5%', value: 'tabs' },
        { text: 'Data sources', sortable: true, width: '5%', value: 'dataSources' },
        { text: 'Last modification', sortable: true, width: '6%', value: 'updatedAt'},
        { text: 'Created', sortable: true, width: '6%', value: 'createdAt'}
      ]
    }
  },

  async mounted () {

  },

  methods: {

    workspaceClicked (event) {
      console.log({event})
      this.$emit('click:workspace',event) // TO-DO: this
    }

  },

  computed: {

    items () {
      if (!this.workspaces || !this.workspaces.length) {
        return []
      }
      return this.workspaces.map((w)=>({
        ...w,
        active: !w.tabs.length, // TO-DO: Pedirle a edo
        name: w.name,
        tabs: w.tabs.length,
        dataSources: w.dataSources.length,
        updatedAt: w.updatedAt,
        createdAt: w.createdAt
      }))
    }
  }
}
</script>
