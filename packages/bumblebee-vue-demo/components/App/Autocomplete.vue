<template>
  <div class="autocomplete">
    <Combobox
      v-slot="{ open }"
      v-model="selected"
      as="div"
      :nullable="true"
      :multiple="multiple"
      class="relative"
    >
      <label v-if="label" class="label autocomplete-label">
        {{ label }}
      </label>
      <div
        class="autocomplete-inputContainer relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-amber-300"
      >
        <div
          v-if="multiple"
          class="autocomplete-field flex items-center flex-wrap gap-2"
        >
          <span
            v-for="(option, index) in selected"
            :key="index"
            :title="option?.text || option"
            class="bg-boitas-yellow flex items-center gap-1 px-2 py-1 text-base rd max-w-[calc(100%-10px)]"
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
              class="px-1"
              @click="selected.splice(index, 1)"
            />
          </span>
          <ComboboxInput
            :display-value="formatterDisplayValues"
            :placeholder="selected && selected.length ? null : placeholder"
            class="autocomplete-hiddenField bg-transparent focus:ring-0 focus:outline-none min-w-20 flex-1"
            autocomplete="off"
            @change="query = $event.target.value"
          />
        </div>
        <ComboboxInput
          v-else
          :display-value="formatterDisplayValues"
          :placeholder="placeholder"
          class="autocomplete-field focus:ring-0"
          autocomplete="off"
          @change="query = $event.target.value"
        />
        <!-- <ComboboxInput :placeholder="placeholder" class="focus:ring-0" autocomplete="off" class="autocomplete-field"
          :display-value="(item) => (item && item.text) || item || ''" @change="query = $event.target.value" /> -->
        <ComboboxButton
          class="absolute inset-y-0 right-0 flex items-center pr-2"
        >
          <Icon
            v-if="props.items.length"
            :path="(open ? mdiChevronUp : mdiChevronDown) || mdiChevronDown"
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
        @after-leave="query = ''"
      >
        <ComboboxOptions
          class="absolute z-1 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
        >
          <div
            v-if="props.items.length === 0 && query !== ''"
            class="relative cursor-default select-none py-2 px-4 text-gray-700"
          >
            No results found
          </div>

          <ComboboxOption
            v-for="(option, index) in props.items"
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
    default: 'Buscar...'
  },
  currentValue: {
    type: [String, Object],
    default: () => null
  },
  items: {
    type: Array,
    default: () => []
  },
  clear: {
    type: Boolean,
    default: false
  },
  multiple: {
    type: Boolean,
    default: () => false
  }
});

const emit = defineEmits(['update', 'update-search']);

const selected = ref(props.currentValue);
const query = ref('');

watch(query, (newQuery, prevQuery) => {
  emit('update-search', newQuery, prevQuery);
});

watch(selected, (newValue, oldValue) => {
  emit('update', newValue, oldValue);
});

watch(
  () => props.clear,
  newValue => {
    if (newValue === true) {
      selected.value = null;
    }
  }
);

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
</script>
