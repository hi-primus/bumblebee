<template>
  <div class="flex flex-col gap-4">
    <AppSelector
      v-if="!preselectedMacroId"
      v-model="macroId"
      name="id"
      label="Macro"
      use-pagination
      :get-options="getOptions"
    />
    <AppSelector
      v-for="(df, index) in macroData?.sources"
      :key="df.name"
      :name="index.toString()"
      :label="`Local dataframe (${df.name})`"
      :options="dataframeOptions"
    />
  </div>
</template>

<script setup lang="ts">
import { Macro } from '@/types/app';
import { DataframeObject } from '@/types/dataframe';

type MacroOption = {
  text: string;
  value: string;
  data: Macro;
};

const props = defineProps({
  getOptions: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type: [Function, Object] as PropType<
      ((page: number) => Promise<MacroOption[]>) | null
    >,
    default: null
  },
  preselectedMacroId: {
    type: String,
    default: ''
  },
  dataframes: {
    type: Array as PropType<DataframeObject[]>,
    default: () => []
  }
});

const macroId = ref<string | null>(null);

const macroData = ref<Macro | null>(null);

const { getMacro } = useMacroActions();

watch(macroId, async () => {
  if (macroId.value) {
    macroData.value = await getMacro(macroId.value);
  }
});

const dataframeOptions = computed(() => {
  return (props.dataframes || []).map(df => {
    return {
      text: `${df.name} (${df.df.name})`,
      value: df.name
    };
  });
});

onMounted(() => {
  if (props.preselectedMacroId) {
    macroId.value = props.preselectedMacroId;
  }
});
</script>
