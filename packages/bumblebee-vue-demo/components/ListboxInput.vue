<template>
  <input
    ref="inputRef"
    v-model="myValue"
    :class="attrClass"
    :style="attrStyle"
    v-bind="attrs"
    @click="openListbox"
    @focus="openListbox"
    @blur="onBlur"
    @keydown="onKeydown"
  />
</template>

<script setup>
const { class: attrClass, style: attrStyle, ...attrs } = useAttrs();

const symbols = Object.getOwnPropertySymbols(
  getCurrentInstance().parent.provides
);
const listboxSymbol = symbols.find(
  symbol => symbol.toString() === 'Symbol(ListboxContext)'
);
const api = inject(listboxSymbol);

const searchText = ref(api.value?.value?.name);

const emit = defineEmits(['update:modelValue']);

const inputRef = ref(null);

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: () => ''
  }
});

const myValue = computed({
  get: () => props.modelValue,
  set: value => {
    emit('update:modelValue', value);
  }
});

// to prevent closing options on 2nd click in input
onMounted(() => {
  api.buttonRef.value = inputRef.value;
});

function openListbox() {
  api.openListbox();
}

function onBlur() {
  searchText.value = api.value?.value?.name;
}

function onKeydown(event) {
  if (event.key === ' ') return;
  api.optionsRef.value.dispatchEvent(new event.constructor(event.type, event));
}

watch(myValue, value => {
  searchText.value = value;
});

watch(searchText, value => {
  if (api.value?.value?.name === value) return;
  api.clearSearch();
  api.openListbox();
  api.search(value);
});

watch(api.value, value => {
  searchText.value = value?.name;
});

defineExpose({
  openListbox: () => {
    api.openListbox();
  }
});
</script>
