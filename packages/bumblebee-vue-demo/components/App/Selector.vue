<template>
  <div class="input selector">
    <Listbox
      v-slot="{ open }"
      v-model="selectedOption"
      as="div"
      :multiple="multiple"
      class="relative"
      :by="text"
      :disabled="disabled"
    >
      <label v-if="label" class="label input-label selector-label">
        {{ label }}
      </label>
      <ListboxButton
        class="selector-button"
        :class="[
          open ? 'selector-buttonOpen' : 'selector-buttonClosed',
          errorMessage ? 'selector-errorInput' : '',
          multiple ? 'flex items-center flex-wrap gap-2' : ''
        ]"
      >
        <template v-if="multiple">
          <span
            v-if="!selectedOption?.length"
            class="block truncate selector-buttonText selector-buttonTextDefault"
          >
            {{ defaultLabel }}
          </span>
          <template v-else>
            <span
              v-for="(option, index) in selectedOption"
              :key="index"
              class="chips-primary max-w-[calc(100%-10px)] z-[3]"
            >
              <span class="truncate max-w-full">{{
                textCallbackWithDefault(option) || option
              }}</span>
              <Icon
                :path="mdiClose"
                class="close-icon"
                @click="selectedOption.splice(index, 1)"
              />
            </span>
          </template>
        </template>
        <template v-else>
          <span
            class="block truncate selector-buttonText"
            :class="[
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
          v-model="selectedOption"
          :close-on-select="!multiple"
          class="absolute z-[3] mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg sm:text-sm outline-0"
          @blur="validate"
        >
          <template v-for="(option, index) in selectorOptions">
            <li
              v-if="option.divider"
              :key="`divider-${index}`"
              class="divider"
            ></li>
            <ListboxOption
              v-else
              v-slot="{ active, selected }"
              :key="index"
              :value="option"
              :disabled="option.disabled"
              as="template"
            >
              <li
                :class="[
                  'selector-option',
                  'relative cursor-default select-none py-2 pl-10 pr-4',
                  option.disabled ? 'opacity-50': '',
                  active
                    ? 'selector-optionActive'
                    : 'selector-optionDefault',
                ]"
              >
                <span class="block truncate">
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
          </template>
          <div
            v-if="options.length === 0"
            class="text-text-lighter text-center py-2"
          >
            <slot name="no-options">
              No items
            </slot>
          </div>
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
import { FieldOption } from '@/types/operations';
import { compareArrays } from '@/utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Value = any;
type Item = Record<string, Value>

const props = defineProps({
  label: {
    type: String,
    default: ''
  },
  modelValue: {
    type: [Object, String, Array] as PropType<Value>,
    default: () => null
  },
  options: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type: Array as PropType<(string | FieldOption<any>)[]>,
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

type Emits = {
  (e: 'update:modelValue', value: Value, oldValue: Value): void;
  (e: 'item-selected', item: Item, oldItem: Item): void;
};

const emit = defineEmits<Emits>();

const selectedOption = ref<Value>(null);

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
const selectorOptions = computed<FieldOption<any>[]>(() => {
  return props.options.map(option => {
    if (typeof option === 'string') {
      return {
        value: option,
        text: option
      };
    }
    return option;
  }).filter(option => !option.hidden);
});

const {
  errorMessage,
  value: validateValue,
  validate
} = useField(props.name, useRules(props.rules));

watch(selectedOption, (item, oldItem) => {
  const value = item?.value || item;
  const oldValue = oldItem?.value || oldItem;
  validateValue.value = (value);

  const valuesFromSelected = selectedOption.value?.map((o: Value) => o?.value || o);
  if ((props.multiple && compareArrays(valuesFromSelected, props.modelValue)) || (!props.multiple && value === props.modelValue)) {
    return;
  }
  emit('update:modelValue', value, oldValue);
  emit('item-selected', item, oldItem);
});

watch(
  () => props.modelValue,
  value => {
    if (props.multiple) {
      const valuesFromSelected = selectedOption.value?.map((o: Value) => o?.value || o);
      if (compareArrays(valuesFromSelected, value)) {
        return;
      }
      selectedOption.value = value.map((v: Value) => {
        return props.options.find(o => {
          if (typeof o !== "object") {
            return o === v;
          }
          return o.value === v;
        }) || v;
      });
    }
    if (selectedOption.value && value && selectedOption.value.value === value) {
      return;
    }
    selectedOption.value = props.options.find(o => {
      if (typeof o !== "object") {
        return o === value;
      }
      return o.value === value;
    }) || value;
  },
  { immediate: true }
);

</script>
