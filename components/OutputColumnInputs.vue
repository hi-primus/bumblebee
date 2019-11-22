<template>
	<v-row no-gutters style="align-items: center">
    <template v-for="(title, i) in currentCommand.columns">
      <v-col v-if="!noLabel" :key="i+'label'" class="col-12 col-sm-4 col-md-3 font-weight-bold pr-4 text-ellipsis" :title="title">
        {{title}}
      </v-col>
      <v-col :key="i" class="col-12 oci-input-container" :class="{'col-sm-8 col-md-9': !noLabel}">
        <v-text-field
          v-model="_currentCommand.output_cols[i]"
          :label="(fieldLabel===true ? title : fieldLabel) || `Output column name`"
          dense
          required
          outlined
          clearable
        ></v-text-field>
      </v-col>
    </template>
	</v-row>
</template>

<script>
export default {
  props: {
    currentCommand: {
      type: Object,
      required: true
    },
    fieldLabel: {
      default: false
    },
    noLabel: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    _currentCommand: {
      set(v) {
        this.$emit('update:currentCommand',v)
      },
      get() {
        return this.currentCommand
      }
    }
  }
}
</script>

<style lang="scss" scoped>
  .row {
    margin-top: -8px;
    margin-bottom: -8px;
    overflow: hidden;
    .oci-input-container {
      margin-top: 8px;
      margin-bottom: 8px;
    }
  }
</style>
