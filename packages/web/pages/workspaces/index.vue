<template>
	<Layout>
		<v-layout row wrap class="elevation-0 d-flex flex-column align-top justify-start">
      <div class="bb-container" data-name="workspace">
        <div class="bb-content">
          {{workspaces}}
          <WorkspacesList
            :workspaces="workspaces"
            @click:workspace="workspaceClicked"
          />
        </div>
        <v-footer fixed="fixed" app>
          <v-layout class="px-4" row justify-space-between>
            <span />
            <span v-if="workspaces" class="caption-2">
              <template
                v-if="workspaces"
              >{{ workspaces.length | formatNumberInt }} Workspaces &emsp;</template>
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
// import { printError } from "@/utils/functions.js"

export default {
	components: {
    Layout,
    WorkspacesList
	},

  middleware: 'authenticated',

  async asyncData ({ store, error }) {

    var workspaces = []

    try {
      let response = await store.dispatch('request',{
        path: `/workspaces`
      })
      workspaces = response.data
    } catch (err) {
      error(err)
      return {}
    }

    return {
      workspaces: workspaces || []
    }
  },

	data () {
		return {

		}
	},

	computed: {

	},

	watch: {

  },

  mounted () {

  },

	methods: {
    workspaceClicked(workspace) {
      this.$router.push({path: `workspaces/${workspace._id}`, query: this.$route.query }) // TO-DO: slug
    }
	}
}
</script>
