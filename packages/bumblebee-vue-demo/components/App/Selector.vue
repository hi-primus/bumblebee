<template>
  <div class="selector">
    <Listbox
      v-slot="{ open }"
      v-model="selectedOption"
      as="div"
      :multiple="multiple"
      :disabled="disabled || !options?.length"
    >
      <label v-if="label" class="label selector-label">
        {{ label }}
      </label>
      <ListboxButton
        class="selector-button relative or-8"
        :class="[
          open ? 'selector-buttonOpen' : 'selector-buttonClosed',
          errorMessage ? 'selector-errorInput' : '',
          multiple ? 'flex items-center flex-wrap gap-2' : ''
        ]"
      >
        <template v-if="multiple">
          <span
            v-if="selectedOption?.length === 0"
            class="block truncate selector-buttonTextDefault"
          >
            {{ defaultLabel }}
          </span>
          <span
            v-for="(option, index) in selectedOption"
            :key="index"
            class="bg-foodit-accent flex items-center gap-1 px-2 py-1 text-base rd"
          >
            <span class="truncate max-w-full">{{
              textCallbackWithDefault(option) || option
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
              'selector-buttonText',
              selectedOption
                ? 'selector-buttonTextSelected'
                : 'selector-buttonTextDefault'
            ]"
          >
            {{
              (selectedOption && selectedOption[text]) ||
                selectedOption ||
                defaultLabel
            }}
          </span>
        </template>
        <span
          class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"
        >
          <Icon
            :path="(open ? mdiChevronUp : mdiChevronDown)"
            :class="[
              open
                ? 'selector-buttonIconOpen'
                : 'selector-buttonIconClosed',
              'selector-buttonIcon'
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
          class="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg sm:text-sm z-2"
          @blur="validate"
        >
          <ListboxOption
            v-for="(option, index) in props.options"
            v-slot="{ active, selected }"
            :key="index"
            :value="option"
            as="template"
          >
            <li
              :class="[
                active
                  ? 'selector-optionActive'
                  : 'selector-optionDefault',
                'selector-option',
                'relative cursor-default select-none py-2 pl-10 pr-4'
              ]"
            >
              <span class="text-left font-500 block truncate">
                <slot
                  name="option"
                  v-bind="typeof option === 'object' ? option : { option }"
                >
                  {{ (option && (option as Record<string, any>)[text]) || option }}
                </slot>
              </span>
              <span
                v-if="selected"
                class="absolute inset-y-0 left-0 flex items-center pl-3"
                :class="[
                  active
                    ? 'selector-optionIconActive'
                    : 'selector-optionIconDefault',
                  'selector-optionIcon'
                ]"
              >
                <Icon v-if="selected" :path="mdiCheckBold" />
                <!-- <Icon v-else-if="!selected" :path="''" /> -->
              </span>
            </li>
          </ListboxOption>
        </ListboxOptions>
      </transition>
    </Listbox>
    <span v-if="errorMessage" class="selector-errorContainer">
      {{ errorMessage }}
    </span>
  </div>
</template>

<script setup lang="ts">
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/vue';
import { mdiCheckBold, mdiChevronDown, mdiChevronUp, mdiClose } from '@mdi/js';
import { useField } from 'vee-validate';
import { PropType } from 'vue';

import { RuleKey } from '@/composables/use-rules';

const props = defineProps({
  label: {
    type: String,
    default: ''
  },
  modelValue: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type: [Object, String, Array] as PropType<any>,
    default: () => null
  },
  options: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type: Array as PropType<(string | Record<string, any>)[]>,
    default: () => []
  },
  textCallback: {
    type: Function as PropType<(option: unknown) => string>
  },
  rules: {
    type: Array as PropType<RuleKey[]>,
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
});

const emit = defineEmits(['update:modelValue']);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const selectedOption = ref<any>(
  props.modelValue || (props.multiple ? [] : null)
);

const defaultLabel = computed(() => {
  if (!props.options?.length) {
    return props.emptyTitle || 'No options available';
  }
  return props.title || 'Select';
});

const textCallbackWithDefault = computed(() => {
  return props.textCallback || ((option: unknown) => (option as Record<string, string>)[props.text]);
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const updateValidateValue = (value: any) => {
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
  value => {
    selectedOption.value = value;
  }
);

const {
  errorMessage,
  value: validateValue,
  validate
} = useField(props.name, useRules(props.rules));

onMounted(() => {
  if (selectedOption.value) {
    updateValidateValue(selectedOption.value);
  }
});
</script>
