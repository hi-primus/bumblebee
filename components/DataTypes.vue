<template>
  <div class="component-container">
    <h3>Data types</h3>
    <v-simple-table class="table">
      <tbody>
        <tr>
          <td style="width:50%;">Bool</td>
          <td style="width:50%;">{{ values.bool }}</td>
        </tr>

        <tr>
          <td style="width:50%;">String</td>
          <td style="width:50%;">{{ values.string }}</td>
        </tr>

        <tr>
          <td style="width:50%;">Int</td>
          <td style="width:50%;">{{ values.int }}</td>
        </tr>

        <tr>
          <td style="width:50%;">Float</td>
          <td style="width:50%;">{{ values.float }}</td>
        </tr>

        <tr>
          <td style="width:50%;">Date</td>
          <td style="width:50%;">{{ values.date }}</td>
        </tr>

        <tr>
          <td style="width:50%;">Missing</td>
          <td style="width:50%;">{{ values.missing }}</td>
        </tr>

        <tr>
          <td style="width:50%;">Null</td>
          <td style="width:50%;">{{ values.null }}</td>
        </tr>
      </tbody>
    </v-simple-table>
  </div>
</template>

<script>
export default {
	props: {
		values: {
			default: {},
			type: Object
		}
	},

	data () {
		return {
			arrDataset: []
		}
	}
}
</script>

<style lang="scss" scoped>
tr {
	border: none !important;
	td {
		height: 15px !important;
		font-size: 11px !important;
	}
}

.no-line {
	td {
		border: none !important;
	}
}
</style>
