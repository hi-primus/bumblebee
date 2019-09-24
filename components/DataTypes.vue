<template>
  <div class="component-container">
    <h3>Data types</h3>
    <table class="details-table">
      <tbody>
        <tr v-for="(value, key) in values" :key="key">
          <td style="width:50%;" class="capitalize">{{ key }}</td>
          <td style="width:50%;">{{ value }}</td>
        </tr>
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
