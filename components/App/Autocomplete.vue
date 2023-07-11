<template>
  <div
    class="input autocomplete"
    :class="{
      'min-w-[14em]': multiple,
      'input-error': errorMessage
    }"
    @click="focusInput"
  >
    <Combobox
      v-slot="{ open }"
      :model-value="selected"
      as="div"
      :nullable="true"
      :multiple="multiple"
      class="relative"
      @update:model-value="updateSelected"
    >
      <label v-if="label" class="label input-label autocomplete-label">
        {{ label }}
      </label>
      <div class="autocomplete-inputContainer relative cursor-default">
        <div
          v-if="multiple"
          class="input-field autocomplete-field min-w-[14em] w-full flex items-center flex-wrap gap-2"
        >
          <span
            v-for="(option, index) in selected"
            :key="index"
            :title="option?.text || option"
            class="chips-primary max-w-[calc(100%-10px)] z-[3]"
          >
            <span class="truncate max-w-full">
              <slot
                name="option"
                v-bind="typeof option === 'object' ? option : { option }"
              >
                {{ option?.text || option }}
              </slot>
            </span>
            <Icon
              :path="mdiClose"
              class="close-icon"
              @click.prevent="removeFromSelected(index)"
            />
          </span>
          <ComboboxInput
            ref="searchInput"
            :display-value="formatterDisplayValues"
            :placeholder="selected && selected.length ? null : placeholder"
            class="autocomplete-hiddenField bg-transparent w-full max-w-[100%] w-min flex-grow"
            :size="inputSize"
            autocomplete="off"
            @change="updateSearch($event.target.value)"
            @keydown.enter="selectOption"
            @keydown.tab="selectOption"
            @keydown.backspace="removeLastOption"
          />
        </div>
        <ComboboxInput
          v-else
          ref="searchInput"
          :display-value="formatterDisplayValues"
          :placeholder="placeholder"
          class="input-field autocomplete-field"
          autocomplete="off"
          :model-value="search"
          @change="search = $event.target.value"
          @blur="validate"
        />
        <div class="icons">
          <slot></slot>
          <button
            v-if="(selected || search) && clearable"
            type="button"
            @click="clear"
          >
            <Icon :path="mdiClose" class="clearIcon w-6" />
          </button>
          <ComboboxButton
            v-if="filteredOptions?.length"
            class="flex items-center"
          >
            <Icon
              :path="open ? mdiChevronUp : mdiChevronDown"
              :class="[
                open
                  ? 'autocomplete-fieldIconOpen'
                  : 'autocomplete-fieldIconClosed',
                'autocomplete-fieldIcon'
              ]"
            />
          </ComboboxButton>
        </div>
      </div>
      <TransitionRoot
        v-if="filteredOptions"
        leave="transition ease-in duration-100"
        leave-from="opacity-100"
        leave-to="opacity-0"
        @after-leave="leave"
      >
        <ComboboxOptions
          class="absolute z-[4] mt-1 max-h-60 min-w-full max-w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg sm:text-sm"
        >
          <div
            v-if="filteredOptions && !filteredOptions.length && search !== ''"
            class="relative cursor-default select-none py-2 px-4 text-neutral-lighter"
          >
            No results found
          </div>

          <ComboboxOption
            v-for="(option, index) in filteredOptions"
            :key="index"
            v-slot="{ selected: optionIsSelected, active }"
            as="template"
            :value="option"
            :disabled="option.disabled"
          >
            <li
              :class="[
                active
                  ? 'autocomplete-optionActive'
                  : 'autocomplete-optionDefault',
                'autocomplete-option',
                'relative cursor-default select-none py-2 pl-10 pr-4'
              ]"
            >
              <span
                class="block truncate"
                :class="{
                  'opacity-50': option.disabled
                }"
              >
                <slot
                  name="option"
                  v-bind="typeof option === 'object' ? option : { option }"
                >
                  {{ option?.text || option }}
                </slot>
              </span>
              <span
                v-if="optionIsSelected"
                class="absolute inset-y-0 left-0 flex items-center pl-3"
                :class="[
                  active
                    ? 'autocomplete-optionIconActive'
                    : 'autocomplete-optionIconDefault',
                  'autocomplete-optionIcon'
                ]"
              >
                <Icon v-if="optionIsSelected" :path="mdiCheckBold" />
              </span>
            </li>
          </ComboboxOption>
        </ComboboxOptions>
      </TransitionRoot>
    </Combobox>
    <span v-if="errorMessage" class="input-errorContainer">
      {{ errorMessage }}
    </span>
  </div>
</template>

<script setup lang="ts">
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  TransitionRoot
} from '@headlessui/vue';
import { mdiCheckBold, mdiChevronDown, mdiChevronUp, mdiClose } from '@mdi/js';
import { useField } from 'vee-validate';
import { PropType, ref } from 'vue';

import { Rule } from '@/composables/use-rules';
import { SelectOption } from '@/types/app';
import { compareArrays } from '@/utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Value = any;
type Item = Record<string, Value>;

const props = defineProps({
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  modelValue: {
    type: [Object, String, Array] as PropType<Value>,
    default: () => null
  },
  search: {
    type: String,
    default: ''
  },
  options: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type: Array as PropType<(string | SelectOption<any>)[] | null>,
    default: () => []
  },
  textCallback: {
    type: Function as PropType<(option: unknown) => string>
  },
  rules: {
    type: Array as PropType<Rule[]>,
    default: () => []
  },
  name: {
    type: String,
    default: () => 'mySelector'
  },
  multiple: {
    type: Boolean,
    default: () => false
  },
  clearable: {
    type: Boolean,
    default: () => false
  },
  text: {
    type: String,
    default: 'text'
  }
});

type Emits = {
  (e: 'update:modelValue', value: Value, oldValue: Value): void;
  (e: 'update:search', value: Value, oldValue: Value): void;
  (e: 'item-selected', item: Item, oldItem: Item): void;
  (e: 'validate', value: boolean | string): void;
};

const emit = defineEmits<Emits>();

const selected = ref();

const searchInput = ref<InstanceType<typeof ComboboxInput> | null>(null);

const inputSize = computed(() => {
  return search.value.length + 1;
});

const options = computed(() => {
  return props.options?.map(option => {
    if (typeof option === 'object') {
      return option;
    }
    return {
      value: option,
      text: option
    };
  });
});

const filteredOptions = computed(() => {
  if (search.value && options.value) {
    return options.value.filter(option => {
      return option[props.text]
        .toLowerCase()
        .includes(search.value.toLowerCase());
    });
  }
  return options.value;
});

const {
  errorMessage,
  value: validateValue,
  validate: validateField
} = useField(props.name, useRules(props.rules));

let hasValidated = false;

const validate = (isExternalCall = false, force = false) => {
  if (!isExternalCall || hasValidated || force) {
    hasValidated = true;
    validateField();
  }
  if (!isExternalCall) {
    emit('validate', errorMessage.value || false);
  }
};

watch(
  selected,
  (item, oldItem) => {
    if (props.multiple) {
      const values = item?.map(getSelectorItemValue);
      if (compareArrays(values, props.modelValue)) {
        return;
      }
      validateValue.value = values;
      emit(
        'update:modelValue',
        values,
        (oldItem || []).map(getSelectorItemValue)
      );
    } else {
      const value = getSelectorItemValue(item);
      const oldValue = getSelectorItemValue(oldItem);
      validateValue.value = value;
      if (!props.multiple && value === props.modelValue) {
        return;
      }
      emit('update:modelValue', value, oldValue);
    }
    emit('item-selected', item, oldItem);
  },
  { deep: true }
);

watch(
  () => props.modelValue,
  value => {
    if (props.multiple) {
      const valuesFromSelected = selected.value?.map(getSelectorItemValue);
      if (compareArrays(valuesFromSelected, value)) {
        return;
      }
      if (!Array.isArray(value)) {
        value = value === null || value === undefined ? [] : [value];
      }
      selected.value = value.map((v: Value) => {
        const foundItem = options.value?.find(o => {
          if (typeof o !== 'object') {
            return o === v;
          }
          return o.value === v;
        });
        return foundItem || v;
      });
    } else {
      if (selected.value && value && selected.value.value === value) {
        return;
      }
      const foundItem = options.value?.find(o => {
        if (typeof o !== 'object') {
          return o === value;
        }
        return o.value === value;
      });
      selected.value = foundItem || value;
    }
  },
  { immediate: true, deep: true }
);

const search = ref('');

watch(
  () => props.search,
  value => {
    search.value = value;
  }
);

watch(
  () => search.value,
  (value, oldValue) => {
    emit('update:search', value, oldValue);
    if (searchInput.value && searchInput.value?.$el?.value !== value) {
      searchInput.value.$el.value = value;
    }
  }
);

const updateSelected = (value: Value) => {
  selected.value = value;
  search.value = '';
};

const removeFromSelected = (index: number) => {
  selected.value = selected.value.filter((_: Value, i: number) => i !== index);
};

const formatterDisplayValues = (items: ArrayOr<Value>) => {
  let text = '';
  if (Array.isArray(items)) {
    if (props.multiple) {
      return '';
    }
    text = items
      .map(item => {
        return item.text;
      })
      .join(', ');
  } else if (items) {
    text = (items && items.text) || items;
  }
  return text;
};

const updateSearch = (value: string) => {
  search.value = value;
};

const clear = () => {
  selected.value = null;
  search.value = '';
};

const leave = () => {
  search.value = '';
};

const selectOption = (event: KeyboardEvent) => {
  if (props.options === null && search.value !== '') {
    event.preventDefault();
    selected.value.push(search.value);
    search.value = '';
  }
};

const removeLastOption = (event: KeyboardEvent) => {
  if (search.value === '' && selected.value.length) {
    event.preventDefault();
    selected.value.pop();
  }
};

function focusInput() {
  if (searchInput.value?.$el) {
    searchInput.value.$el.focus();
  }
}

defineExpose({
  validate
});
</script>
