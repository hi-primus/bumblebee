<template>
	<Layout>
    <v-dialog
      v-if="showDialog"
      :value="showDialog"
      @input="$event ? true : showDialog = false"
      max-width="1220">
      <SettingsList
        v-if="showDialog === 'engines'"
        is-dialog
        preferred
        @back="showDialog = false"
        title="Manage engines"
      />
      <ConnectionsList
        v-else
        is-dialog
        @back="showDialog = false"
        title="Manage connections"
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
import ConnectionsList from "@/components/ConnectionsList"
import MoreMenu from "@/components/MoreMenu"
import clientMixin from "@/plugins/mixins/client"

import { HELP_LINK } from "bumblebee-utils"

export default {
	components: {
    Layout,
    WorkspacesList,
    SettingsList,
    ConnectionsList,
    MoreMenu
  },

  mixins: [ clientMixin ],

  // TO-DO: Check
  middleware: 'authenticated',

	data () {
		return {
      total: 0,
      showDialog: false
		}
	},

	computed: {
    moreMenu () {

      var menu = [
        { text: 'Engines', click: ()=>{this.showDialog = 'engines'}},
        { text: 'Connections', click: ()=>{this.showDialog = 'connections'}},
      ];

      if (HELP_LINK) {
        menu = [
          ...menu,
          { divider: true },
          { text: 'Help', link: HELP_LINK }
        ];
      }

      menu = [
        ...menu,
        { divider: true },
        { text: 'Sign out', click: this.signOut }
      ];

      return menu;
    },
	},

	watch: {

  },

  mounted () {
    window.intercomSettings["vertical_padding"] = 48;
    window.Intercom("update");
  },

	methods: {

	}
}
</script>
