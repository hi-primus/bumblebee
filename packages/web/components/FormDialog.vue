<template>
  <v-dialog
    v-if="form.promise"
    :value="form.promise"
    :max-width="form.width || 380"
    @click:outside="acceptForm(false)"
  >
    <v-form @submit.prevent="acceptForm(true)">
      <v-card>
        <v-card-title class="title">{{form.text}}</v-card-title>
        <v-card-text class="pb-1">
          <template v-for="(field, index) in form.fields">
            <v-checkbox
              v-if="field.checkbox"
              :key="index"
              v-model="field.value"
              :label="`${field.label}: ${field.value ? 'Yes' : 'No'}`"
              hide-details
            ></v-checkbox>
            <component
              v-else
              :is="field.textarea ? 'v-textarea' : 'v-text-field'"
              :key="index"
              v-model="field.value"
              ref="formInput"
              outlined
              dense
              :label="field.label"
              :placeholder="field.placeholder"
              hide-details
              :class="{'pt-4': index!==0}"
            />
          </template>
        </v-card-text>
        <v-textarea v-show="false"></v-textarea>
        <v-text-field v-show="false"></v-text-field>
        <v-card-actions>
          <div class="flex-grow-1" />
          <v-btn color="primary" text @click="acceptForm(false)">Cancel</v-btn>
          <v-btn color="primary" text :disabled="form.disabled ? form.disabled() : false" type="submit">Accept</v-btn>
        </v-card-actions>
      </v-card>
    </v-form>
  </v-dialog>
</template>

<script>
export default {
  data () {
    return {
      form: {
        promise: false,
        fields: []
      }
    }
  },

  methods: {

    fromForm (form) {
      this.form = form
      return new Promise((resolve, reject) => {
        this.form = { ...this.form, promise: {resolve, reject} }
      })
    },

    acceptForm (accept) {
      try {
        this.form.promise.resolve(accept && this.form)
      } catch (err) {
        console.error(err)
      }
      this.form = {...this.form, promise: false}
    },
  }
}
</script>
