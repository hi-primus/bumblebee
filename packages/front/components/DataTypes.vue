<template>
  <div class="component-container">
    <h3>Data types</h3>
    <table class="details-table">
      <tbody>
        <template v-for="(value, key) in values">
          <tr v-if="key!=='null' && key!=='missing'" :key="key">
            <td style="width:50%;" class="capitalize" :title="key">{{ key }}</td>
            <td style="width:50%;" :title="value">{{ value }}</td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
	props: {
		values: {
			default: {},
			type: Object
		}
	}
}
</script>

<style lang="scss" scoped>
tr {
	border: none !important;
	td {
		font-size: 13px !important;
	}
}
</style>
