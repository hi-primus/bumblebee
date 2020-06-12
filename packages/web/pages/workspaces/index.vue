<template>
	<Layout>
		<v-layout row wrap class="elevation-0 d-flex flex-column align-top justify-start">
      <div class="bb-container" data-name="workspace">
        <div class="bb-content">
          <!-- WIP -->
        </div>
        <v-footer fixed="fixed" app>
          <v-layout class="px-4" row justify-space-between>
            <span />
            <span v-if="workspaces" class="caption-2">
              <template
                v-if="workspaces.count"
              >{{ workspaces.count | formatNumberInt }} Workspaces &emsp;</template>
            </span>
          </v-layout>
        </v-footer>
      </div>
		</v-layout>
	</Layout>
</template>


<script>
import Layout from "@/components/Layout"
// import clientMixin from "@/plugins/mixins/client"
// import applicationMixin from "@/plugins/mixins/application"
// import { printError } from "@/utils/functions.js"
// import { RESPONSE_MESSAGES } from "@/utils/constants.js"

// import { mapGetters } from "vuex"

const { version } = require("@/package.json")

export default {
	components: {
		Layout,
		TableBar
	},

  // mixins: [clientMixin, dataTypesMixin, applicationMixin],

  middleware: 'authenticated',

	data () {
		return {
      workspaces: {
        count: 3
      }
		}
	},

	computed: {

	},

	watch: {

  },

  mounted () {

  },

	methods: {

	}
}
</script>
