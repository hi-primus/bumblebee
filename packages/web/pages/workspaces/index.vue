<template>
	<Layout>
		<v-layout row wrap class="elevation-0 d-flex flex-column align-top justify-start">
      <div class="workspace-container" data-name="workspace">
        <MoreMenu
          :items="moreMenu"
        >
        </MoreMenu>
        <div class="bb-content pa-12">
          <WorkspacesList
            @update:total="total = $event"
          />
        </div>
        <v-footer fixed="fixed" app>
          <v-layout class="px-4" row justify-space-between>
            <span />
            <span v-if="typeof total !== 'undefined'" class="caption-2">
              {{ total | formatNumberInt }} Workspaces &emsp;
            </span>
          </v-layout>
        </v-footer>
      </div>
		</v-layout>
	</Layout>
</template>


<script>
import Layout from "@/components/Layout"
import WorkspacesList from "@/components/WorkspacesList"
import MoreMenu from "@/components/MoreMenu"
import clientMixin from "@/plugins/mixins/client"
// import { printError } from "@/utils/functions.js"

export default {
	components: {
    Layout,
    WorkspacesList,
    MoreMenu
  },

  mixins: [ clientMixin ],

  // TO-DO: Check
  // middleware: 'authenticated',

	data () {
		return {
      total: 0
		}
	},

	computed: {
    moreMenu () {

      var menu = [
        { text: 'Sign out', click: this.signOut }
      ]

      return menu
    },
	},

	watch: {

  },

  mounted () {

  },

	methods: {
    signOut (waiting = true) {
      this.stopClient(waiting)
      this.$store.dispatch('session/signOut')
      this.$router.push({path: '/login', query: this.$route.query })
    },
	}
}
</script>
