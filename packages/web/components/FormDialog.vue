<template>
  <v-dialog
    v-if="promise"
    :value="promise"
    :max-width="form.width || 380"
    @click:outside="!disableBack && acceptForm(false)"
    :persistent="!!disableBack"
  >
    <v-form @submit.prevent="acceptForm(true)" ref="form">
      <v-card>
        <v-btn
          icon large color="black"
          @click="!disableBack && acceptForm(false)"
          class="title-button-left"
          v-if="!disableBack">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
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
                  autocomplete="off"
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
                  autocomplete="off"
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
                v-else-if="field.props && field.props.type == 'password'"
                :is="field.is || 'v-text-field'"
                :key="index"
                v-model="values[field.key]"
                ref="formInput"
                outlined
                dense
                v-bind="field.props"
                :placeholder="getProperty(field.props.placeholder, [values])"
                hide-details
                autocomplete="off"
                :class="{'pt-4': index!==0}"
                :type="show[field.key] ? 'text' : 'password'"
                :append-icon="show[field.key] ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append="$set(show, field.key, !show[field.key])"
              />
              <component
                v-else
                :is="field.is || 'v-text-field'"
                :key="index"
                v-model="values[field.key]"
                ref="formInput"
                outlined
                dense
                v-bind="field.props"
                :items="getProperty(field.props.items, [values])"
                :placeholder="getProperty(field.props.placeholder, [values])"
                hide-details
                autocomplete="off"
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
          <!-- <v-btn color="primary" text @click="acceptForm(false)">Cancel</v-btn> -->
          <template v-if="form.extraButtons && form.extraButtons.length">
            <template v-for="button in form.extraButtons">
              <v-btn color="primary" :key="button.event" text :disabled="button.checkDisabled && form.disabled ? form.disabled(values) : false" @click="buttonEvent(button.event)">{{button.label}}</v-btn>
            </template>
          </template>
          <v-btn color="primary" :disabled="form.disabled ? form.disabled(values) : false" type="submit">{{acceptLabel}}</v-btn>
        </v-card-actions>
      </v-card>
    </v-form>
  </v-dialog>
</template>

<script>

import { getProperty } from 'bumblebee-utils';

export default {

  props: {
    focus: {
      type: Boolean,
      default: false
    },
    disableBack: {
      type: Boolean,
      default: false
    }
  },

  data () {
    return {
      show: {},
      promise: false,
      form: {},
      values: {}
    }
  },

  computed: {
    acceptLabel () {
      return this.form.acceptLabel || 'Accept'
    },
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

    getProperty,

    buttonEvent (e) {
      var values = this.values
      values._event = e;
      try {
        this.promise.resolve(values);
      } catch (err) {
        console.error(err);
      }
      this.promise = false;
    },

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
