<template>
  <NuxtLayout>
    <div class="workspace-container">
      <Tabs
        v-model:selected="selectedDataframe"
        :tabs="dataframes.map(({ name }) => ({ label: name }))"
      />
      <WorkspaceDataframeLayout
        :key="selectedDataframe"
        :dataframe="
          selectedDataframe >= 0
            ? dataframes[selectedDataframe].profile
            : undefined
        "
        :get-chunk="getChunk"
        @close="(index: number) => dataframes.splice(index, 1)"
      />
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import type { Client, Source } from 'blurr/build/main/types';

import {
  isOperation,
  OperationActions,
  OperationOptions,
  Payload,
  State,
  TableSelection
} from '@/types/operations';
import { DataframeProfile } from '@/types/profile';

const blurrPackage = useBlurr();

let blurr: Client;

const dataframes = ref<
  { name?: string; df?: Source; profile?: DataframeProfile }[]
>([]);

const selectedDataframe = ref(-1);

onMounted(async () => {
  const { Blurr } = blurrPackage;
  blurr = Blurr({
    serverOptions: {
      scriptURL: 'https://cdn.jsdelivr.net/pyodide/v0.21.3/full/pyodide.js',
      local: true
    }
  });
  window.blurr = blurr;
  await blurr.backendServer.donePromise;
  const result = await blurr.runCode("'successfully loaded'");
  console.info('Initialization result:', result);
});

const state = ref<State>(null);
provide('state', state);

const selection = ref<TableSelection>(null);
provide('selection', selection);

watch(
  () => state.value,
  () => {
    operationValues.value = {};
  }
);

const operationValues = ref<Payload>({});
provide('operation-values', operationValues);

const operationActions: OperationActions = {
  submitOperation: () => {
    console.info('Operation payload:', JSON.stringify(operationValues.value));

    const operation = isOperation(state.value) ? state.value : null;

    if (!operation) {
      console.error('Invalid operation', state.value);
      return;
    }

    const { options, ...operationPayload } = operationValues.value;

    const operationOptions: OperationOptions = Object.assign(
      {},
      options,
      operation.defaultOptions
    );

    const payload: Payload = {
      blurr,
      options: operationOptions,
      ...operationPayload
    };

    if (operationOptions.usesInputDataframe) {
      payload.df = dataframes.value[selectedDataframe.value].df;
    }

    const result = operation.action(payload);

    console.info('Operation result:', { result, operationOptions });

    if (operationOptions.targetType === 'dataframe') {
      const df = result as Source;
      if (operationOptions.saveToNewDataframe) {
        const newLength = dataframes.value.push({
          name: 'dataset',
          df,
          profile: df.profile()
        });
        selectedDataframe.value = newLength - 1;
      } else {
        dataframes.value[selectedDataframe.value].df = result;
        dataframes.value[selectedDataframe.value].profile = df.profile();
      }
    }

    operationValues.value = {};

    state.value = 'operations';
  },
  cancelOperation: () => {
    console.info('Operation cancelled');
    operationValues.value = {};
    state.value = 'operations';
  }
};

provide('operation-actions', operationActions);

//

const getChunk = function (start: number, stop: number) {
  const df = dataframes.value[selectedDataframe.value].df;

  if (!df) {
    return;
  }
  const chunk = {
    start,
    stop,
    data: df.iloc(start, stop).columnsSample().value
  };
  console.info('Chunk result:', chunk);
  return chunk;
};
</script>

<style lang="scss">
.workspace-container {
  height: 100vh;
  width: 100vw;
  display: grid;
  grid-template-columns: 1fr minmax(180px, 420px);
  grid-template-rows: min-content min-content 1fr min-content;
  gap: 0px 0px;
  grid-auto-flow: row;
  grid-template-areas:
    'tabs tabs'
    'toolbar toolbar'
    'table operations'
    'footer footer';
}

.bumblebee-tabs {
  grid-area: tabs;
}
.workspace-toolbar {
  grid-area: toolbar;
}
.workspace-table {
  grid-area: table;
}
aside {
  grid-area: operations;
}
footer {
  height: 48px;
  grid-area: footer;
}
</style>
