<template>
	<Layout v-show="showWorkspaces">
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
		<v-layout wrap class="elevation-0 pa-0 d-flex flex-column align-top justify-start">
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
          <v-layout class="px-4" justify-space-between>
            <span />
            <span v-if="total !== undefined" class="caption-2">
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
  middleware: ['authenticated', ({store, redirect, route, app}) => {
    let query = route.query;
    let workspace = query.workspace;
    let username = query.username || store.state.session.username;
    if (workspace && username && process.env.QUICK_WORKSPACE_CREATION) {
      delete query.username;
      delete query.workspace;
      workspace = `${username}-${workspace}`
      redirect({ path: '/workspaces/' + workspace, query });
    }
  }],

	data () {
		return {
      total: 0,
      showDialog: false,
      showWorkspaces: !process.env.QUICK_WORKSPACE_CREATION
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


      if (!process.env.QUICK_USER_AUTH) {
        menu.push({ divider: true });
        menu.push({ text: 'Sign out', click: this.signOut });
      }

      return menu;
    },
	},

	watch: {

  },

  mounted () {
    window.intercomSettings["vertical_padding"] = 48;
    window.Intercom("update");
    setTimeout(() => {
      this.showWorkspaces = true;
    }, 3000);
  },

	methods: {

	}
}
</script>
