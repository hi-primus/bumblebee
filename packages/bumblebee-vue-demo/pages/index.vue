<template>
  <NuxtLayout>
    <div class="workspace-container">
      <Tabs
        v-model:selected="selectedDataframe"
        :tabs="dataframes.map(({ name }) => ({ label: name }))"
      />
      <WorkspaceDataframeLayout
        :key="selectedDataframe"
        :get-chunk="getChunk"
        @close="(index: number) => dataframes.splice(index, 1)"
      />
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import type { Client, Source } from 'blurr/build/main/types';

import { DataframeObject } from '@/types/dataframe';
import {
  isOperation,
  OperationActions,
  OperationOptions,
  OperationPayload,
  Payload,
  State,
  TableSelection
} from '@/types/operations';
import { AppStatus } from '@/types/workspace';
import { preliminaryProfile } from '@/utils/blurr';
import { compareObjects } from '@/utils';

const blurrPackage = useBlurr();

let blurr: Client;

const dataframes = ref<DataframeObject[]>([]);

const selectedDataframe = ref(-1);

const appStatus = ref<AppStatus>('loading');
provide('app-status', appStatus);

onMounted(async () => {
  const { Blurr } = blurrPackage;
  blurr = Blurr({
    serverOptions: {
      scriptURL: 'https://cdn.jsdelivr.net/pyodide/v0.21.3/full/pyodide.js',
      useWorker: true
    }
  });
  window.blurr = blurr;
  await blurr.backendServer.donePromise;
  const result = await blurr.runCode("'successfully loaded'");
  if (appStatus.value === 'loading') {
    appStatus.value = 'ready';
  }
  console.info('Initialization result:', result);
});

const state = ref<State>(null);
provide('state', state);

const selection = ref<TableSelection>(null);
provide('selection', selection);

const dataframe = computed(() => {
  return selectedDataframe.value >= 0
    ? dataframes.value[selectedDataframe.value]
    : undefined;
});
provide('dataframe', dataframe);

watch(
  () => state.value,
  () => {
    operationValues.value = {};
  }
);

const executedOperations = ref<OperationPayload[]>([]);

const operations = ref<OperationPayload[]>([]);
provide('operations', operations);

const operationValues = ref<Payload>({});
provide('operation-values', operationValues);

const handleOperationResult = async (result: unknown, payload: Payload) => {
  if (payload.options.targetType === 'dataframe') {
    const df = result as Source;
    if (payload.options.saveToNewDataframe) {
      const newLength = dataframes.value.push({
        name: 'dataset',
        sourceId: payload.options.sourceId,
        df,
        profile: await preliminaryProfile(df),
        updates: 0
      });
      selectedDataframe.value = newLength - 1;
      console.log(
        '[DEBUG] Creating dataframe:',
        dataframes.value[selectedDataframe.value]
      );
    } else {
      const currentDataframe = dataframes.value[selectedDataframe.value];
      currentDataframe.df = df;
      currentDataframe.profile = await preliminaryProfile(df);
      currentDataframe.updates = currentDataframe.updates + 1;
      console.log('[DEBUG] Updating dataframe:', currentDataframe);
      dataframes.value[selectedDataframe.value] = currentDataframe;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    df.profile().then((profile: any) => {
      dataframes.value[selectedDataframe.value].profile = profile;
    });
  } else {
    // TODO: Handle other types of targets
    console.info('Operation result:', result);
  }
};

const checkSources = (data: OperationPayload[]) => {
  const sources = data.map(operation => operation.payload.options.sourceId);
  dataframes.value = dataframes.value.filter(
    dataframe => !dataframe.sourceId || sources.includes(dataframe.sourceId)
  );
};

const executeOperations = async () => {
  const data = operations.value;

  checkSources(data);

  let previousPayload: Payload | null = null;
  let result: unknown;

  for (let i = 0; i < data.length; i++) {
    // Skip operations that have already been executed
    if (executedOperations.value.length > i) {
      if (compareObjects(data[i], executedOperations.value[i])) {
        continue;
      }
    }

    const { operation, payload } = data[i];

    if (!isOperation(operation)) {
      throw new Error('Invalid operation', { cause: operation });
    }
    result = await operation.action({ ...payload, blurr });
    console.info('Operation result:', { result, options: payload.options });

    previousPayload = payload;
  }

  executedOperations.value = [...data];

  if (previousPayload !== null) {
    return await handleOperationResult(result, previousPayload);
  }
};

const operationActions: OperationActions = {
  submitOperation: async () => {
    try {
      appStatus.value = 'busy';

      console.info('Operation payload:', JSON.stringify(operationValues.value));

      const operation = isOperation(state.value) ? state.value : null;

      if (operation) {
        const { options, ...operationPayload } = operationValues.value;

        const operationOptions: OperationOptions = Object.assign(
          {},
          options,
          operation.defaultOptions
        );

        const payload: Payload = {
          options: operationOptions,
          ...operationPayload
        };

        if (operationOptions.saveToNewDataframe) {
          payload.options.sourceId =
            dataframes.value.length.toString() + (+new Date()).toString();
        }

        if (operationOptions.usesInputDataframe) {
          const currentDataframe = dataframes.value[selectedDataframe.value];
          payload.df = currentDataframe.df;
          payload.options.sourceId = currentDataframe.sourceId;
        }

        if (operationOptions.usesInputCols) {
          payload.cols = selection.value?.columns;
        }

        operations.value.push({ operation, payload });
      }

      await executeOperations();

      operationValues.value = {};

      state.value = 'operations';
      appStatus.value = 'ready';
    } catch (err) {
      console.error('Error executing operation', err);
      appStatus.value = 'ready'; // 'error';
    }
  },
  cancelOperation: () => {
    console.info('Operation cancelled');
    operationValues.value = {};
    state.value = 'operations';
  }
};

provide('operation-actions', operationActions);

//

const getChunk = async function (start: number, stop: number) {
  const df = dataframes.value[selectedDataframe.value].df;

  if (!df) {
    return;
  }

  window.df = df;

  const sample = await df
    .iloc({
      target: 'preview_' + df.name,
      lower_bound: start,
      upper_bound: stop
    })
    .columnsSample();

  const chunk = {
    start,
    stop,
    data: sample.value
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
  height: 36px;
  grid-area: footer;
}
</style>
