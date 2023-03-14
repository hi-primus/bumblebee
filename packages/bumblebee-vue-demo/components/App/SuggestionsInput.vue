<template>
  <Listbox
    v-slot="{ open }"
    ref="listbox"
    as="div"
    class="input text-input"
    :class="[attrClass]"
    :style="(attrStyle as StyleValue)"
    @update:model-value="useSuggestion"
  >
    <label v-if="label" :for="name" class="label input-label text-input-label">
      {{ label }}
    </label>
    <ListboxInput
      ref="listboxInput"
      v-model="myValue"
      :name="name"
      :type="type"
      class="input-field text-input-field"
      :placeholder="placeholder"
      v-bind="attrs"
      @click="fieldClicked(true)"
      @focus="fieldClicked(false)"
      @blur="fieldBlurred"
      @keydown="keyPressed"
    />
    <div v-if="menuVisible" class="suggestions-menu p-2 mt-px">
      <div v-if="functionInfo" class="flex flex-col gap-2 text-text-light p-1">
        <div
          class="font-mono text-lg"
          v-html="functionInfo.highlighted || functionInfo.title"
        ></div>
        <div class="text-xs">
          {{ functionInfo.description }}
        </div>
        <template v-if="functionInfo.example">
          <div class="title -mb-2">Example</div>
          <div class="font-mono" v-html="functionInfo.example"></div>
        </template>
        <template v-if="functionInfo?.parameters?.length">
          <div class="divider"></div>
          <div
            v-for="(parameter, index) in functionInfo.parameters"
            :key="parameter.name"
          >
            <span
              class="font-mono font-bold"
              :class="{
                'text-primary': index === functionInfo.activeParameter
              }"
              >{{ parameter.name }}:
            </span>
            <span>{{ parameter.description }}</span>
          </div>
        </template>
        <template v-if="resultsSuggestions?.length">
          <div class="divider"></div>
          <div class="title mt-2">Suggestions</div>
        </template>
      </div>
      <ListboxOptions static class="text-text-light">
        <ListboxOption
          v-for="suggestion in resultsSuggestions"
          v-slot="{ active }"
          :key="suggestion.text"
          :value="suggestion"
          as="template"
        >
          <div
            class="pl-3 pr-1 py-[2px] -mx-2 flex items-center font-mono font-bold cursor-pointer"
            :class="{ 'bg-primary-highlight': active }"
          >
            <div class="name flex-1 text-text-alpha/60">
              {{ suggestion.title || suggestion.text }}
            </div>
            <div class="type-label capitalize text-text-alpha/50">
              {{ suggestion.type }}
            </div>
            <div class="type-icon text-text-alpha/50 pl-2">
              <Icon
                class="w-5 h-5"
                :path="
                  suggestion.type === 'function' ? mdiFunction : mdiTableColumn
                "
              />
            </div>
          </div>
        </ListboxOption>
      </ListboxOptions>
    </div>
  </Listbox>
</template>

<script lang="ts">
import { Listbox, ListboxOption, ListboxOptions } from '@headlessui/vue';
import { mdiFunction, mdiTableColumn } from '@mdi/js';
import { PropType, StyleValue } from 'vue';

import ListboxInput from '@/components/ListboxInput.vue';
import { RuleKey } from '@/composables/use-rules';
import { Suggestion } from '@/types/operations';
import { SuggestionContext } from '@/utils/suggestions';
import { debounce } from '@/utils/time';

export default {
  inheritAttrs: false
};
</script>

<script setup lang="ts">
const emit = defineEmits(['update:modelValue']);

const props = defineProps({
  modelValue: {
    type: String as PropType<string>,
    default: () => ''
  },
  label: {
    type: String,
    default: () => ''
  },
  suggestions: {
    type: Array as PropType<Suggestion[]>,
    default: () => []
  },
  placeholder: {
    type: String,
    default: () => ''
  },
  type: {
    type: String,
    default: () => 'text'
  },
  rules: {
    type: Array as PropType<RuleKey[]>,
    default: () => []
  },
  name: {
    type: String,
    default: () => 'myValue'
  },
  suggestOnEmpty: {
    type: String as PropType<'column' | 'function'>,
    default: () => ''
  }
});

const { class: attrClass, style: attrStyle, ...attrs } = useAttrs();

const myValue = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
});

const listboxInput = ref<typeof ListboxInput | null>(null);

const caretPosition = ref(0);

const activeWord = ref('');
const activeWordPosition = ref(0);

const resultsSuggestions = ref<SuggestionValue[]>([]);

const menuEnabled = ref(false);

const suggestionContext = ref<SuggestionContext | null>(null);

const checkCaret = (force = false) => {
  const inputElement = listboxInput.value?.$el;
  const newCaretPosition = inputElement.selectionStart;
  if (force || newCaretPosition !== caretPosition) {
    caretPosition.value = newCaretPosition;
    try {
      suggestionContext.value = getSuggestionContext(
        myValue.value.toString(),
        caretPosition.value
      );
    } catch (err) {
      console.warn(err);
    }
  }
};

const debouncedCheckCaret = debounce(checkCaret, 100);

watch(myValue, () => debouncedCheckCaret(false));

const searchSuggestions = (parameterTypes?: string[]) => {
  if (activeWord.value) {
    // TODO: implement fuzzy search
    resultsSuggestions.value = allSuggestions.value.filter(s => {
      return s.text.toLowerCase().startsWith(activeWord.value.toLowerCase());
    });
  } else if (parameterTypes) {
    resultsSuggestions.value = allSuggestions.value.filter(s =>
      parameterTypes.includes(s.type)
    );
  } else if (props.suggestOnEmpty) {
    if (suggestionContext.value && suggestionContext.value.activeWord === ')') {
      resultsSuggestions.value = [];
    } else {
      resultsSuggestions.value = allSuggestions.value.filter(
        sugg => sugg.type === props.suggestOnEmpty
      );
    }
  } else {
    resultsSuggestions.value = [];
  }
};

const searchSuggestionsThrottled = throttle(searchSuggestions, 100);

const fieldClicked = async (isClick = false) => {
  if (!myValue.value) {
    activeWord.value = '';
    searchSuggestions();
  }
  if (!menuEnabled.value) {
    await new Promise(resolve => setTimeout(resolve, 150));
    menuEnabled.value = true;
  }
};

const fieldBlurred = async () => {
  // delay to avoid closing before triggering option selection
  await new Promise(resolve => setTimeout(resolve, 100));
  menuEnabled.value = false;
};

const setCaretPosition = (caretPos: number) => {
  const inputElement = listboxInput.value?.$el;

  if (inputElement != null) {
    if (inputElement.createTextRange) {
      const range = inputElement.createTextRange();
      range.move('character', caretPos);
      range.select();
    } else if (inputElement.selectionStart) {
      inputElement.focus();
      inputElement.setSelectionRange(caretPos, caretPos);
    } else {
      inputElement.focus();
    }
  }
};

let avoidPropagation = false;

const addAtCaretPos = (str: string) => {
  const at = caretPosition.value;
  const newValue = [
    myValue.value.substring(0, at),
    str,
    myValue.value.substring(at, myValue.value.length)
  ].join('');
  const newCaretPosition = caretPosition.value + str.length;
  emit('update:modelValue', newValue);
  nextTick(() => {
    avoidPropagation = false;
    setCaretPosition(newCaretPosition);
  });
};

const getFunctionSuggestion = (functionName: string) => {
  return allSuggestions.value.find(
    f => f.type === 'function' && f.text === functionName
  );
};

const functionInfo = computed(() => {
  if (!suggestionContext.value || !suggestionContext.value.inFunction) {
    return null;
  }
  if (
    suggestionContext.value.activeCompleteWord !==
    suggestionContext.value.inFunction.value /* && useFunctions */
  ) {
    const functionName = suggestionContext.value.inFunction.value;
    const info = functionName && getFunctionSuggestion(functionName);
    if (!info) {
      return false;
    }
    const params = info.parameters;
    let highlighted = functionName + '(';
    const currentParam = suggestionContext.value.inFunction.inParameter;
    if (params?.length) {
      for (let i = 0; i < params.length; i++) {
        const param = params[i];
        if (i === currentParam) {
          highlighted += `<span class="function-parameter-highlight">${param.name}</span>`;
        } else {
          highlighted += param.name;
        }

        if (i !== params.length - 1) {
          highlighted += ', ';
        }
      }
    }
    highlighted += ')';
    return {
      ...info,
      activeParameter: suggestionContext.value.inFunction.inParameter,
      highlighted
      // parameterName: params[currentParam].name,
      // parameterDescription: params[currentParam].description
    };
  }
  return null;
});

const menuVisible = computed(() => {
  return (
    menuEnabled.value &&
    (resultsSuggestions.value.length > 0 || functionInfo.value)
  );
});

const useSuggestion = async (newWord = { text: '', type: '' }) => {
  if (avoidPropagation) {
    return;
  }

  avoidPropagation = true;

  if (!newWord?.text) {
    return;
  }

  let splittedString;

  activeWordPosition.value = activeWordPosition.value || 0;

  if (activeWord.value && activeWord.value.length) {
    splittedString = [
      myValue.value.substring(0, activeWordPosition.value),
      myValue.value.substring(
        activeWordPosition.value + activeWord.value.length,
        myValue.value.length
      )
    ];
  } else {
    splittedString = [
      myValue.value.substring(0, activeWordPosition.value + 1),
      myValue.value.substring(
        activeWordPosition.value + 1,
        myValue.value.length
      )
    ];
  }

  avoidPropagation = true;

  const inP = myValue.value[caretPosition.value] === ')';

  let newWordText = newWord.text;

  // gets , or ) depending on parameter

  let addChar: string | null = null;

  if (
    suggestionContext.value &&
    suggestionContext.value.inFunction?.value &&
    suggestionContext.value.inFunction.inParameter &&
    newWord.type !== 'function'
  ) {
    const param = getParameter(
      suggestionContext.value.inFunction.value,
      suggestionContext.value.inFunction.inParameter + 1
    );
    if (param) {
      addChar = ',';
    } else {
      addChar = ')';
    }
    if (splittedString[1][0] !== addChar) {
      newWordText += addChar;
    }
  }

  if (newWord.type === 'function') {
    newWordText += '(';
  } else if (addChar !== ')') {
    newWordText += ' ';
  }

  const value = splittedString[0] + newWordText + splittedString[1];

  const caretPos = activeWordPosition.value + newWordText.length + 1;

  emit('update:modelValue', value);

  await new Promise(resolve => setTimeout(resolve, 0));

  avoidPropagation = false;
  setCaretPosition(caretPos);
  menuEnabled.value = true;
  checkCaret(true);
  if (
    suggestionContext.value &&
    !suggestionContext.value.inFunction &&
    suggestionContext.value.activeCompleteWord ===
      suggestionContext.value.activeWord
  ) {
    await new Promise(resolve => setTimeout(resolve, 0));
    menuEnabled.value = false;
  }
};

const enterKeyEvent = async (event: KeyboardEvent) => {
  if (!functionInfo.value && !resultsSuggestions.value?.length) {
    return;
  }

  if (!menuEnabled.value) {
    enableMenu();
  } else if (!avoidPropagation) {
    await new Promise(resolve => setTimeout(resolve, 0));
    if (menuEnabled.value) {
      await useSuggestion(resultsSuggestions.value?.[0]);
    } else if (functionInfo.value) {
      if (
        functionInfo.value.activeParameter ===
        (functionInfo.value?.parameters?.length || 0) - 1
      ) {
        addAtCaretPos(') ');
      } else {
        addAtCaretPos(', ');
      }
    }
  }

  event.stopPropagation();
  event.preventDefault();
};

const enableMenu = () => {
  if (!menuEnabled.value) {
    menuEnabled.value = true;
    listboxInput.value?.openListbox();
    debouncedCheckCaret(true);
  }
};

const keyPressed = (event: KeyboardEvent) => {
  const key = event.key.toLowerCase();

  if (key === 'enter') {
    enterKeyEvent(event);
  } else if (key === 'arrowdown' || (key === ' ' && event.ctrlKey)) {
    enableMenu();
  } else if (key === 'arrowup') {
    event.preventDefault();
  } else if (key === 'escape' && menuEnabled.value) {
    menuEnabled.value = false;
    event.preventDefault();
    event.stopPropagation();
  } else {
    enableMenu();
  }
};

type ReservedWordsFunction =
  (typeof reservedWords.functions)[keyof typeof reservedWords.functions];

interface SuggestionValue extends Partial<Omit<ReservedWordsFunction, 'text'>> {
  text: string;
  title: string;
  type: 'function' | 'column';
}

const allSuggestions = computed<SuggestionValue[]>(() => {
  const functionNames = Object.keys(reservedWords.functions);
  return [
    ...Object.values(reservedWords.functions).map(s => {
      const parameters = s.parameters?.map(parameter => {
        if (parameter.name === 'col_name') {
          return {
            name: 'column',
            type: 'column',
            description: "A column's name"
          };
        } else {
          return parameter;
        }
      });
      return {
        ...s,
        parameters,
        title: s.text,
        type: 'function' as const
      };
    }),
    ...props.suggestions.map(s => ({
      text:
        functionNames.includes(s.value) ||
        s.value.includes(' ') ||
        s.value.includes('-')
          ? `{${s.value}}`
          : s.value,
      title: s.name,
      type: 'column' as const
    }))
  ];
});

const getParameter = (functionName: string, parameterIndex: number) => {
  if (!(functionName in reservedWords.functions)) {
    console.warn(`Function ${functionName} not found`);
    return null;
  }
  const functionInfo = getFunctionSuggestion(functionName);
  if (functionInfo) {
    return functionInfo.parameters?.[parameterIndex];
  }
  return null;
};

watch(suggestionContext, () => {
  if (!suggestionContext.value) {
    resultsSuggestions.value = [];
    return;
  }
  if (
    suggestionContext.value.activeWord &&
    suggestionContext.value.activeCompleteWord &&
    suggestionContext.value.activeWord.length <
      suggestionContext.value.activeCompleteWord.length
  ) {
    resultsSuggestions.value = [];
    return;
  }
  const newActiveWord = suggestionContext.value.activeWord;
  if (newActiveWord && !['(', ')', ','].includes(newActiveWord)) {
    activeWord.value = newActiveWord;
  } else {
    activeWord.value = '';
  }
  activeWordPosition.value = suggestionContext.value.activeWordPosition || 0;
  let types;
  if (
    !activeWord &&
    suggestionContext.value.inFunction?.value &&
    suggestionContext.value.inFunction?.inParameter
  ) {
    const param = getParameter(
      suggestionContext.value.inFunction.value,
      suggestionContext.value.inFunction.inParameter
    );
    types = param ? param.type : []; // TO-DO: get param.types
    if (!Array.isArray(types)) {
      types = [types];
    }
  }
  searchSuggestionsThrottled(types);
});
</script>

<style lang="scss">
.suggestions-menu {
  @apply absolute z-[4] max-h-80 w-full overflow-auto rounded-md bg-white text-base shadow-lg sm:text-sm outline-0;
  .function-parameter-highlight {
    @apply font-bold text-primary;
  }
  .divider {
    @apply bg-line w-full h-px;
  }
  .title {
    @apply uppercase font-medium text-text-lightest;
  }
}
</style>
