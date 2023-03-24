# Contributing to this demo

## Use `const` to define methods

```vue
<script setup lang="ts">
const myMethod = async function () {
  return await asyncMethod(...);
}
</script>
```

## Using typed component emits

https://vuejs.org/guide/typescript/composition-api.html#typing-component-emits

```vue
<script setup lang="ts">
// runtime
const emit = defineEmits(['change', 'update']);

// type-based
type Emits = {
  (e: 'change', id: number): void;
  (e: 'update', value: string): void;
  (e: 'updateScroll', start: number, stop: number): void;
};
const emit = defineEmits<Emits>();
</script>
```

## Using PropType to type props

```vue
<script setup lang="ts">
const props = defineProps({
  customs: {
    type: Array as PropType<Custom[]>,
    default: () => []
  },
  custom: {
    type: Number as PropType<Custom>,
    required: true
  },
  deleted: {
    type: Array as PropType<Custom[]>
  }
});
</script>
```

## Using apply for complex tailwind classes

```css
.pseudo-primary-button {
  @apply bg-primary-dark text-white px-4 py-2 rounded;
}
```

## Using themes system

Buttons have `size` and `color`:

```vue
<template>
  <AppButton
    @click="onClickEvent"
    class="icon-button color-danger size-narrow rounded-button"
  >
    <Icon :path="mdiTrashCan" />
  </AppButton>
</template>
```

Text fields have `text-input-` prefix:

```vue
<template>
  <AppInput class=""> </AppInput>
</template>
```
