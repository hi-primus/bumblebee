<template>
  <div>
    <AppInput placeholder="test" />
    <AppSelector
      :model-value="'option1'"
      :options="['option1', 'option2']"
      label="selector"
      @update:model-value="() => {}"
      name="selector"
    />
    <AppCheckbox
      name="checkbox"
      label="checkbox"
      :model-value="false"
      @update:model-value="() => {}"
      class="w-full px-2 pt-4 z-3"
    />
  </div>
</template>
<script setup lang="ts">
const props = defineProps({
  name: {
    type: String,
    required: true
  }
});
</script>
