<template>
  <NuxtLayout>
    <div class="components-container">
      <div class="flex flex-wrap gap-4 px-8 py-2">
        <AppButton>Accept</AppButton>
        <AppButton class="btn-layout-outline">Outline</AppButton>
        <AppButton class="btn-layout-invisible">Invisible</AppButton>
        <AppButton class="btn-layout-text">Text</AppButton>
        <AppButton class="btn-icon"><Icon :path="mdiCheckBold"/></AppButton>
        <AppButton class="btn-icon btn-layout-invisible"><Icon :path="mdiCheckBold"/></AppButton>
        <AppButton class="btn-icon btn-rounded"><Icon :path="mdiCheckBold"/></AppButton>
      </div>
      <div class="flex flex-wrap gap-4 px-8 py-2">
        <AppButton class="btn-rounded">Accept</AppButton>
        <AppButton class="btn-rounded btn-layout-outline">Outline</AppButton>
        <AppButton class="btn-rounded btn-layout-invisible">Invisible</AppButton>
        <AppButton class="btn-rounded btn-layout-text">Text</AppButton>
        <AppButton class="btn-rounded btn-icon"><Icon :path="mdiCheckBold"/></AppButton>
        <AppButton class="btn-icon btn-layout-invisible"><Icon :path="mdiCheckBold"/></AppButton>
        <AppButton class="btn-icon btn-rounded"><Icon :path="mdiCheckBold"/></AppButton>
      </div>
      <div class="flex flex-wrap gap-4 px-8 py-2">
        <AppButton class="btn-color-error ">Delete</AppButton>
        <AppButton class="btn-color-error btn-layout-outline">Delete</AppButton>
        <AppButton class="btn-color-error btn-layout-invisible">Delete</AppButton>
        <AppButton class="btn-color-error btn-layout-text">Delete</AppButton>
        <AppButton class="btn-color-error btn-icon"><Icon :path="mdiTrashCan"/></AppButton>
        <AppButton class="btn-color-error btn-icon btn-rounded"><Icon :path="mdiTrashCan"/></AppButton>
      </div>
      <div class="flex flex-wrap gap-4 px-8 py-2">
        <AppButton class="btn-color-text ">Cancel</AppButton>
        <AppButton class="btn-color-text btn-layout-outline">Cancel</AppButton>
        <AppButton class="btn-color-text btn-layout-invisible">Cancel</AppButton>
        <AppButton class="btn-color-text btn-layout-text">Cancel</AppButton>
        <AppButton class="btn-color-text btn-icon"><Icon :path="mdiTrashCan"/></AppButton>
        <AppButton class="btn-color-text btn-icon btn-rounded"><Icon :path="mdiTrashCan"/></AppButton>
        <!-- small -->
      </div>
      <div class="flex flex-wrap gap-4 px-8 py-2">
        <AppButton class="btn-size-small">Accept</AppButton>
        <AppButton class="btn-size-small btn-layout-outline">Outline</AppButton>
        <AppButton class="btn-size-small btn-layout-invisible">Invisible</AppButton>
        <AppButton class="btn-size-small btn-layout-text">Text</AppButton>
        <AppButton class="btn-size-small btn-icon"><Icon :path="mdiCheckBold"/></AppButton>
        <AppButton class="btn-size-small btn-icon btn-rounded"><Icon :path="mdiCheckBold"/></AppButton>
      </div>
      <div class="flex flex-wrap gap-4 px-8 py-2">
        <AppButton class="btn-size-small btn-color-error ">Delete</AppButton>
        <AppButton class="btn-size-small btn-color-error btn-layout-outline">Delete</AppButton>
        <AppButton class="btn-size-small btn-color-error btn-layout-invisible">Delete</AppButton>
        <AppButton class="btn-size-small btn-color-error btn-layout-text">Delete</AppButton>
        <AppButton class="btn-size-small btn-color-error btn-icon"><Icon :path="mdiTrashCan"/></AppButton>
        <AppButton class="btn-size-small btn-color-error btn-icon btn-rounded"><Icon :path="mdiTrashCan"/></AppButton>
      </div>
      <div class="flex flex-wrap gap-4 px-8 py-2">
        <AppButton class="btn-size-small btn-color-text ">Cancel</AppButton>
        <AppButton class="btn-size-small btn-color-text btn-layout-outline">Cancel</AppButton>
        <AppButton class="btn-size-small btn-color-text btn-layout-invisible">Cancel</AppButton>
        <AppButton class="btn-size-small btn-color-text btn-layout-text">Cancel</AppButton>
        <AppButton class="btn-size-small btn-color-text btn-icon"><Icon :path="mdiTrashCan"/></AppButton>
        <AppButton class="btn-size-small btn-color-text btn-icon btn-rounded"><Icon :path="mdiTrashCan"/></AppButton>
      </div>
      <div class="flex flex-wrap gap-4 px-8 py-2">
        <AppInput class="">
        </AppInput>
        <AppInput class="text-input-size-condensed">
        </AppInput>
        <AppInput class="text-input-size-small">
        </AppInput>
      </div>
      <div class="flex flex-wrap gap-4 px-8 py-2">
        <AppInput placeholder="input value example" class="">
        </AppInput>
        <AppInput placeholder="input value example" class="text-input-size-condensed">
        </AppInput>
        <AppInput placeholder="input value example" class="text-input-size-small">
        </AppInput>
      </div>
      <div class="flex flex-wrap gap-4 px-8 py-2">
        <AppInput label="label" placeholder="placeholder value" class="">
        </AppInput>
        <AppInput label="label" placeholder="placeholder value" class="text-input-size-condensed">
        </AppInput>
        <AppInput label="label" placeholder="placeholder value" class="text-input-size-small">
        </AppInput>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  mdiCheckBold, mdiTrashCan
} from '@mdi/js';
</script>

<style lang="scss">
</style>
