<template>
  <NuxtLayout>
    <div class="components-container">
      <div class="flex flex-wrap gap-4 px-8 py-2">
        <AppButton>Accept</AppButton>
        <AppButton class="btn-layout-outline">Outline</AppButton>
        <AppButton class="btn-layout-invisible">Invisible</AppButton>
        <AppButton class="btn-layout-text">Text</AppButton>
        <AppButton class="btn-icon"><Icon :path="mdiCheckBold" /></AppButton>
        <AppButton class="btn-icon btn-layout-invisible"
          ><Icon :path="mdiCheckBold"
        /></AppButton>
        <AppButton class="btn-icon btn-rounded"
          ><Icon :path="mdiCheckBold"
        /></AppButton>
      </div>
      <div class="flex flex-wrap gap-4 px-8 py-2">
        <AppButton class="btn-rounded">Accept</AppButton>
        <AppButton class="btn-rounded btn-layout-outline">Outline</AppButton>
        <AppButton class="btn-rounded btn-layout-invisible"
          >Invisible</AppButton
        >
        <AppButton class="btn-rounded btn-layout-text">Text</AppButton>
        <AppButton class="btn-rounded btn-icon"
          ><Icon :path="mdiCheckBold"
        /></AppButton>
        <AppButton class="btn-icon btn-layout-invisible"
          ><Icon :path="mdiCheckBold"
        /></AppButton>
        <AppButton class="btn-icon btn-rounded"
          ><Icon :path="mdiCheckBold"
        /></AppButton>
      </div>
      <div class="flex flex-wrap gap-4 px-8 py-2">
        <AppButton class="btn-color-error">Delete</AppButton>
        <AppButton class="btn-color-error btn-layout-outline">Delete</AppButton>
        <AppButton class="btn-color-error btn-layout-invisible"
          >Delete</AppButton
        >
        <AppButton class="btn-color-error btn-layout-text">Delete</AppButton>
        <AppButton class="btn-color-error btn-icon"
          ><Icon :path="mdiTrashCan"
        /></AppButton>
        <AppButton class="btn-color-error btn-icon btn-rounded"
          ><Icon :path="mdiTrashCan"
        /></AppButton>
      </div>
      <div class="flex flex-wrap gap-4 px-8 py-2">
        <AppButton class="btn-color-text">Cancel</AppButton>
        <AppButton class="btn-color-text btn-layout-outline">Cancel</AppButton>
        <AppButton class="btn-color-text btn-layout-invisible"
          >Cancel</AppButton
        >
        <AppButton class="btn-color-text btn-layout-text">Cancel</AppButton>
        <AppButton class="btn-color-text btn-icon"
          ><Icon :path="mdiTrashCan"
        /></AppButton>
        <AppButton class="btn-color-text btn-icon btn-rounded"
          ><Icon :path="mdiTrashCan"
        /></AppButton>
        <!-- small -->
      </div>
      <div class="flex flex-wrap gap-4 px-8 py-2">
        <AppButton class="btn-size-small">Accept</AppButton>
        <AppButton class="btn-size-small btn-layout-outline">Outline</AppButton>
        <AppButton class="btn-size-small btn-layout-invisible"
          >Invisible</AppButton
        >
        <AppButton class="btn-size-small btn-layout-text">Text</AppButton>
        <AppButton class="btn-size-small btn-icon"
          ><Icon :path="mdiCheckBold"
        /></AppButton>
        <AppButton class="btn-size-small btn-icon btn-rounded"
          ><Icon :path="mdiCheckBold"
        /></AppButton>
      </div>
      <div class="flex flex-wrap gap-4 px-8 py-2">
        <AppButton class="btn-size-small btn-color-error">Delete</AppButton>
        <AppButton class="btn-size-small btn-color-error btn-layout-outline"
          >Delete</AppButton
        >
        <AppButton class="btn-size-small btn-color-error btn-layout-invisible"
          >Delete</AppButton
        >
        <AppButton class="btn-size-small btn-color-error btn-layout-text"
          >Delete</AppButton
        >
        <AppButton class="btn-size-small btn-color-error btn-icon"
          ><Icon :path="mdiTrashCan"
        /></AppButton>
        <AppButton class="btn-size-small btn-color-error btn-icon btn-rounded"
          ><Icon :path="mdiTrashCan"
        /></AppButton>
      </div>
      <div class="flex flex-wrap gap-4 px-8 py-2">
        <AppButton class="btn-size-small btn-color-text">Cancel</AppButton>
        <AppButton class="btn-size-small btn-color-text btn-layout-outline"
          >Cancel</AppButton
        >
        <AppButton class="btn-size-small btn-color-text btn-layout-invisible"
          >Cancel</AppButton
        >
        <AppButton class="btn-size-small btn-color-text btn-layout-text"
          >Cancel</AppButton
        >
        <AppButton class="btn-size-small btn-color-text btn-icon"
          ><Icon :path="mdiTrashCan"
        /></AppButton>
        <AppButton class="btn-size-small btn-color-text btn-icon btn-rounded"
          ><Icon :path="mdiTrashCan"
        /></AppButton>
      </div>
      <div class="flex flex-wrap gap-4 px-8 py-2">
        <AppInput class=""> </AppInput>
        <AppInput class="input-size-condensed"> </AppInput>
        <AppInput class="input-size-small"> </AppInput>
      </div>
      <div class="flex flex-wrap gap-4 px-8 py-2">
        <AppInput placeholder="Column" class=""> </AppInput>
        <AppInput placeholder="Column" class="input-size-condensed"> </AppInput>
        <AppInput placeholder="Column" class="input-size-small"> </AppInput>
      </div>
      <div class="flex flex-wrap gap-4 px-8 py-2">
        <AppInput label="label" placeholder="Column" class=""> </AppInput>
        <AppInput
          label="label"
          placeholder="Column"
          class="input-size-condensed"
        >
        </AppInput>
        <AppInput label="label" placeholder="Column" class="input-size-small">
        </AppInput>
      </div>
      <div class="flex flex-wrap gap-4 px-8 py-2">
        <AppAutocomplete
          v-model="selectedColumns"
          :options="columns"
          multiple
          label="label"
          placeholder="Column"
          class=""
        >
        </AppAutocomplete>
        <AppAutocomplete
          v-model="selectedColumns"
          :options="columns"
          multiple
          label="label"
          placeholder="Columns"
          name="input-size-condensed"
          class="input-size-condensed"
        >
        </AppAutocomplete>
        <AppAutocomplete
          v-model="selectedColumns"
          :options="columns"
          multiple
          label="label"
          placeholder="Columns"
          name="input-size-small"
          class="input-size-small"
        >
        </AppAutocomplete>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { mdiCheckBold, mdiTrashCan } from '@mdi/js';

const columns = ref([
  'firstName',
  'lastName',
  'id',
  'email',
  'phone',
  'address',
  'description',
  'city',
  'zipCode',
  'state',
  'country'
]);
const selectedColumns = ref<string[]>([]);
</script>

<style lang="scss"></style>
