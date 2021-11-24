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
    if (process.env.QUICK_WORKSPACE_CREATION) {
      let query = route.query;
      let workspace = query.workspace;
      let username = query.username || store.state.session.username;
  
      if (!username) {
        let email = query.email || '';
        username = email.replace(/[^a-zA-Z0-9]/g, '_');
      }
  
      if (workspace && username) {
        delete query.username;
        delete query.email;
        delete query.workspace;
        redirect({ path: '/workspaces/' + workspace, query });
      }
    }
  }],

	data () {
		return {
      total: 0,
      showDialog: false,
      showWorkspaces: !process.env.QUICK_WORKSPACE_CREATION,
      showAuth: !process.env.QUICK_USER_AUTH
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


      if (this.showAuth) {
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
