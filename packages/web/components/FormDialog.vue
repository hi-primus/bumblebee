<template>
  <v-dialog
    v-if="promise"
    :value="promise"
    :max-width="form.width || 380"
    @click:outside="acceptForm(false)"
  >
    <v-form @submit.prevent="acceptForm(true)" ref="form">
      <v-card>
        <v-card-title class="title">{{form.text}}</v-card-title>
        <v-card-text class="pb-1" style="margin-top: -6px; padding-top: 6px; max-height: 70vh; overflow-y: auto;">
          <template v-for="(field, index) in filteredFields">
            <template>
              <div
                v-if="field.type === 'address'"
                :key="index"
                class="d-flex"
                :class="{'pt-4': index!==0}"
              >
                <component
                  :is="field.is || 'v-text-field'"
                  v-model="values[field.key].ip"
                  class="flex-grow-2"
                  ref="formInput"
                  outlined
                  dense
                  v-bind="field.props"
                  label="Address"
                  hide-details
                />
                <component
                  :is="field.is || 'v-text-field'"
                  v-model="values[field.key].port"
                  class="flex-grow-1 ml-3"
                  style="max-width: 35%;"
                  ref="formInput"
                  outlined
                  dense
                  v-bind="field.props"
                  label="Port"
                  hide-details
                />
              </div>
              <v-checkbox
                v-else-if="field.type === 'checkbox'"
                :key="index"
                v-model="values[field.key]"
                :label="`${field.props.label}: ${values[field.key] ? 'Yes' : 'No'}`"
                hide-details
              ></v-checkbox>
              <component
                v-else
                :is="field.is || 'v-text-field'"
                :key="index"
                v-model="values[field.key]"
                ref="formInput"
                outlined
                dense
                v-bind="field.props"
                hide-details
                :class="{'pt-4': index!==0}"
              />

            </template>
          </template>
        </v-card-text>
        <v-textarea v-show="false"></v-textarea>
        <v-text-field v-show="false"></v-text-field>
        <v-select v-show="false"></v-select>
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

  props: {
    focus: {
      type: Boolean,
      default: false
    }
  },

  data () {
    return {
      promise: false,
      form: {},
      values: {}
    }
  },

  computed: {
    filteredFields () {
        try {
          return this.form.fields.filter(field => field.condition ? field.condition(this.values) : true)
        } catch (err) {
          console.error(err)
          return  []
        }
      }
  },

  mounted () {
    if (this.focus) {
      this.autoFocus();
    }
  },

  methods: {

    fromForm (form) {
      this.form = form;
      let values = {}
      this.form.fields.forEach(field => {
        values[field.key] = field.value;
      });
      this.values = values;
      return new Promise((resolve, reject) => {
        this.promise = { resolve, reject }
      })
    },

    acceptForm (accept) {
      try {
        this.promise.resolve(accept && this.values);
      } catch (err) {
        console.error(err);
      }
      this.promise = false;
    },

    autoFocus () {
      setTimeout(()=>{
        var ref = this.$refs.form;
        if (ref) {
          ref = ref.$el || ref;
          var el = ref.getElementsByTagName('input')[0]
          if (el) {
            el.focus()
          }
        }
      }, 100)
    }
  },

  watch: {
    promise () {
      if (this.promise) {
        this.autoFocus();
      }
    }
  }
}
</script>
