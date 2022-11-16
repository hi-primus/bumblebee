<template>
  <div :class="style.classes.container">
    <Listbox
      as="div"
      v-model="selectedOption"
      v-slot="{ open }"
      :multiple="multiple"
      :disabled="disabled || !options?.length"
    >
      <label v-if="label" class="label" :class="style.classes.label">
        {{ label }}
      </label>
      <ListboxButton
        class="relative"
        :class="[
          style.classes.button,
          open ? style.classes.buttonOpen : style.classes.buttonClosed,
          errorMessage ? style.classes.errorInput : '',
          multiple ? 'flex items-center flex-wrap gap-2' : '',
          style.icons.button !== false &&
          (open ? style.icons.buttonOpen : style.icons.buttonDefault)
            ? 'pr-8'
            : ''
        ]"
      >
        <template v-if="multiple">
          <span
            v-if="selectedOption?.length === 0"
            class="block truncate"
            :class="style.classes.buttonTextDefault"
          >
            {{ defaultLabel }}
          </span>
          <span
            v-for="(option, index) in selectedOption"
            :key="index"
            class="bg-foodit-accent flex items-center gap-1 px-2 py-1 text-base rd"
          >
            <span class="truncate max-w-full">{{
              (option && option[text]) || option
            }}</span>
            <Icon
              :path="mdiClose"
              class="px-1"
              @click="selectedOption.splice(index, 1)"
            />
          </span>
        </template>
        <template v-else>
          <span
            class="block truncate"
            :class="[
              style.classes.buttonText,
              selectedOption
                ? style.classes.buttonTextSelected
                : style.classes.buttonTextDefault
            ]"
            >{{
              (selectedOption && selectedOption[text]) ||
              selectedOption ||
              defaultLabel
            }}</span
          >
        </template>
        <span
          v-if="
            (style.icons.button !== false &&
              (open ? style.icons.buttonOpen : style.icons.buttonDefault)) ||
            style.icons.button
          "
          class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"
        >
          <Icon
            :path="open ? mdiArrowUpDropCircle : mdiArrowDownDropCircle"
            :class="[
              open
                ? style.classes.buttonIconOpen
                : style.classes.buttonIconClosed,
              style.classes.buttonIcon
            ]"
          />
        </span>
      </ListboxButton>
      <transition
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <ListboxOptions
          class="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-2"
          @blur="validate"
        >
          <ListboxOption
            v-slot="{ active, selected }"
            v-for="(option, index) in props.options"
            :key="index"
            :value="option"
            as="template"
          >
            <li
              :class="[
                active
                  ? style.classes.optionActive
                  : style.classes.optionDefault,
                style.classes.option,
                'relative cursor-default select-none py-2 pl-10 pr-4'
              ]"
            >
              <span class="text-left font-500 block truncate">
                <slot
                  name="option"
                  v-bind="typeof option === 'object' ? option : { option }"
                >
                  {{ (option && option[text]) || option }}
                </slot>
              </span>
              <span
                v-if="
                  style.icons.option &&
                  (selected
                    ? style.icons.optionSelected
                    : style.icons.optionDefault)
                "
                class="absolute inset-y-0 left-0 flex items-center pl-3"
                :class="[
                  active
                    ? style.classes.optionIconActive
                    : style.classes.optionIconDefault,
                  style.classes.optionIcon
                ]"
              >
                <Icon v-if="selected" :path="mdiCheck" />
                <Icon v-else-if="!selected" :path="style.icons.optionDefault" />
              </span>
            </li>
          </ListboxOption>
        </ListboxOptions>
      </transition>
    </Listbox>
    <span v-if="errorMessage" :class="style.classes.errorContainer">
      {{ errorMessage }}
    </span>
  </div>
</template>

<script setup lang="ts">
import {
  mdiArrowUpDropCircle,
  mdiArrowDownDropCircle,
  mdiCheck,
  mdiClose
} from '@mdi/js';
import { useField } from 'vee-validate';
// import { isRequired } from "@/composables/rules";
import { getThemeProps, useTheme, useThemeStyle } from '@/composables/themes';

import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption
} from '@headlessui/vue';

const props = defineProps({
  label: {
    type: String,
    default: ''
  },
  modelValue: {
    type: [Object, String, Array],
    default: () => null
  },
  options: {
    type: Array,
    default: () => []
  },
  rules: {
    type: Array,
    default: () => []
  },
  name: {
    type: String,
    default: () => 'mySelector'
  },
  title: {
    type: String,
    default: () => null
  },
  emptyTitle: {
    type: String,
    default: () => null
  },
  multiple: {
    type: Boolean,
    default: () => false
  },
  disabled: {
    type: Boolean
  },
  text: {
    type: String,
    default: 'text'
  },
  ...getThemeProps('selector')
});

const emit = defineEmits(['update:modelValue']);

const theme = useTheme(props.theme);

const style = useThemeStyle(
  theme,
  props.variant,
  'selector',
  'Selector',
  props.classes,
  props.icons,
  style => {
    if (style.icons.button) {
      style.icons.buttonOpen = style.icons.buttonDefault = '';
    }

    return style;
  }
);

const selectedOption = ref<any>(
  props.modelValue || (props.multiple ? [] : null)
);

const defaultLabel = computed(() => {
  if (!props.options?.length) {
    return props.emptyTitle || 'No hay opciones disponibles';
  }
  return props.title || 'Selecciona una opcion';
});

const updateValidateValue = value => {
  if (Array.isArray(value)) {
    validateValue.value = value.map(item => {
      return item?.value;
    });
  } else {
    validateValue.value = value;
  }
};

watch(selectedOption, (newValue, oldValue) => {
  updateValidateValue(newValue);
  emit('update:modelValue', newValue, oldValue);
});

watch(
  () => props.modelValue,
  (curr, prev) => {
    selectedOption.value = props.modelValue;
  }
);

const rules = computed(() => {
  const useRules = [];

  for (let i = 0; i < props.rules.length; i++) {
    const rule = props.rules[i];
    switch (rule) {
      case 'required':
        // useRules.push(isRequired);
        break;
    }
  }

  return useRules;
});

const {
  errorMessage,
  value: validateValue,
  validate
} = useField(props.name, rules.value);

onMounted(() => {
  if (selectedOption.value) {
    updateValidateValue(selectedOption.value);
  }
});
</script>
