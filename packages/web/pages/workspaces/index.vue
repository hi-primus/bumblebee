<template>
	<Layout>
    <v-dialog
      v-if="showEngines"
      :value="showEngines"
      @click:outside="showEngines = false"
      max-width="1220">
      <SettingsList
        preferred
        @back="showEngines = false"
        title="Manage engines"
      />
    </v-dialog>
		<v-layout row wrap class="elevation-0 d-flex flex-column align-top justify-start">
      <div class="bb-container" data-name="workspaces">
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
import SettingsList from "@/components/SettingsList"
import MoreMenu from "@/components/MoreMenu"
import clientMixin from "@/plugins/mixins/client"

export default {
	components: {
    Layout,
    WorkspacesList,
    SettingsList,
    MoreMenu
  },

  mixins: [ clientMixin ],

  // TO-DO: Check
  middleware: 'authenticated',

	data () {
		return {
      total: 0,
      showEngines: false
		}
	},

	computed: {
    moreMenu () {

      var menu = [
        { text: 'Engines', click: ()=>{this.showEngines = true}},
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

	}
}
</script>
