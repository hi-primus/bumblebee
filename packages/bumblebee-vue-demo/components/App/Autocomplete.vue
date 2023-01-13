<template>
  <div class="input autocomplete">
    <Combobox
      v-slot="{ open }"
      v-model="selected"
      as="div"
      :nullable="true"
      :multiple="multiple"
      class="relative"
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
            class="bg-primary-lighter text-text-alpha flex items-center gap-1 px-1 text-sm rounded-md max-w-[calc(100%-10px)] z-[3]"
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
              class="pr-1 cursor-pointer"
              @click="selected.splice(index, 1)"
            />
          </span>
          <ComboboxInput
            :display-value="formatterDisplayValues"
            :placeholder="selected && selected.length ? null : placeholder"
            class="autocomplete-hiddenField bg-transparent min-w-20 flex-1"
            autocomplete="off"
            @change="search = $event.target.value"
          />
        </div>
        <ComboboxInput
          v-else
          :display-value="formatterDisplayValues"
          :placeholder="placeholder"
          class="input-field autocomplete-field"
          autocomplete="off"
          @change="search = $event.target.value"
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
            v-if="options.length"
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
            v-if="options.length === 0 && search !== ''"
            class="relative cursor-default select-none py-2 px-4 text-text-lighter"
          >
            No results found
          </div>

          <ComboboxOption
            v-for="(option, index) in options"
            :key="index"
            v-slot="{ selectedOption, active }"
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
                  'font-medium': selectedOption,
                  'font-normal': !selectedOption,
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
  </div>
</template>

<script setup>
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  TransitionRoot
} from '@headlessui/vue';
import { mdiCheckBold, mdiChevronDown, mdiChevronUp, mdiClose } from '@mdi/js';
import { ref } from 'vue';

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
    type: [String, Object],
    default: () => null
  },
  search: {
    type: String,
    default: ''
  },
  options: {
    type: Array,
    default: () => []
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

const emit = defineEmits(['update:modelValue', 'update:search']);

const selected = ref(props.modelValue);

watch(
  () => props.modelValue,
  value => {
    selected.value = value;
  }
);

watch(
  () => selected.value,
  (value, oldValue) => {
    emit('update:modelValue', value, oldValue);
  }
);

const search = ref('');

watch(
  () => props.search,
  value => {
    search.value = value;
  }
);

watch(search, (value, oldValue) => {
  emit('update:search', value, oldValue);
});

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
