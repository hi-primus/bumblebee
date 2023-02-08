<template>
  <div class="input autocomplete">
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
          class="input-field autocomplete-field flex items-center flex-wrap gap-2"
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
              @click="selected.splice(index, 1)"
            />
          </span>
          <ComboboxInput
            ref="searchInput"
            :display-value="formatterDisplayValues"
            :placeholder="selected && selected.length ? null : placeholder"
            class="autocomplete-hiddenField bg-transparent min-w-20 flex-1"
            autocomplete="off"
            @change="search = $event.target.value"
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
        <Icon
          v-if="(selected || search) && clearable"
          :path="mdiClose"
          :class="style.classes.clearIcon"
          @click="clear"
        />
        <ComboboxButton
          class="absolute inset-y-0 right-0 flex items-center pr-2"
        >
          <Icon
            v-if="filteredOptions.length"
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
      <TransitionRoot
        leave="transition ease-in duration-100"
        leave-from="opacity-100"
        leave-to="opacity-0"
        @after-leave="search = ''"
      >
        <ComboboxOptions
          class="absolute z-[3] mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg sm:text-sm"
        >
          <div
            v-if="filteredOptions.length === 0 && search !== ''"
            class="relative cursor-default select-none py-2 px-4 text-text-lighter"
          >
            No results found
          </div>

          <ComboboxOption
            v-for="(option, index) in filteredOptions"
            :key="index"
            v-slot="{ selected: selectedOption, active }"
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
                v-if="selectedOption"
                class="absolute inset-y-0 left-0 flex items-center pl-3"
                :class="[
                  active
                    ? 'autocomplete-optionIconActive'
                    : 'autocomplete-optionIconDefault',
                  'autocomplete-optionIcon'
                ]"
              >
                <Icon v-if="selectedOption" :path="mdiCheckBold" />
              </span>
            </li>
          </ComboboxOption>
        </ComboboxOptions>
      </TransitionRoot>
    </Combobox>
    <span v-if="errorMessage" class="selector-errorContainer">
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

import { RuleKey } from '@/composables/use-rules';
import { FieldOption } from '@/types/operations';

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
};

const emit = defineEmits<Emits>();

const selected = ref(props.modelValue);

const searchInput = ref<typeof ComboboxInput | null>(null);

const filteredOptions = computed(() => {
  if (search.value) {
    return props.options.filter(option => {
      if (typeof option === 'object') {
        return option[props.text].toLowerCase().includes(search.value);
      }
      return option.toLowerCase().includes(search.value);
    });
  }
  return props.options;
});

const {
  errorMessage,
  value: validateValue,
  validate
} = useField(props.name, useRules(props.rules));

watch(selected, (item, oldItem) => {
  const value = item?.value || item;
  const oldValue = oldItem?.value || oldItem;
  validateValue.value = value;

  if (props.multiple) {
    const valuesFromSelected = item?.map((o: Value) => o?.value || o);
    if (compareArrays(valuesFromSelected, props.modelValue)) {
      return;
    }
  } else if (!props.multiple && value === props.modelValue) {
    return;
  }
  emit('update:modelValue', value, oldValue);
  emit('item-selected', item, oldItem);
});

watch(
  () => props.modelValue,
  value => {
    if (props.multiple) {
      const valuesFromSelected = selected.value?.map(
        (o: Value) => o?.value || o
      );
      if (compareArrays(valuesFromSelected, value)) {
        return;
      }
      selected.value = value.map((v: Value) => {
        return (
          props.options.find(o => {
            if (typeof o !== 'object') {
              return o === v;
            }
            return o.value === v;
          }) || v
        );
      });
    }
    if (selected.value && value && selected.value.value === value) {
      return;
    }
    selected.value =
      props.options.find(o => {
        if (typeof o !== 'object') {
          return o === value;
        }
        return o.value === value;
      }) || value;
  },
  { immediate: true }
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
    if (props.multiple && value === '' && searchInput.value?.el?.value !== '') {
      searchInput.value.el.value = '';
    }
  }
);

const updateSelected = value => {
  selected.value = value;
  search.value = '';
};

const formatterDisplayValues = items => {
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

const clear = () => {
  selected.value = null;
  search.value = '';
};
</script>
