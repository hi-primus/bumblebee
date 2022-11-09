# Contributing to this demo

## Using typed component emits

https://vuejs.org/guide/typescript/composition-api.html#typing-component-emits

```vue
<script setup lang="ts">
// runtime
const emit = defineEmits(['change', 'update'])

// type-based
const emit = defineEmits<{
  (e: 'change', id: number): void
  (e: 'update', value: string): void
}>()
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
})
</script>
```

## Using apply for complex tailwind classes

```css
.btn-primary {
  @apply bg-primary-800 text-white px-4 py-2 rounded;
}
```
