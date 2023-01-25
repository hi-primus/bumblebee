<template>
  <NuxtLayout>
    <div
      class="workspace-container"
      :class="{ 'hide-operations': !showSidebar }"
    >
      <Tabs
        v-model:selected="selectedDataframe"
        :tabs="dataframes.map(({ name }) => ({ label: name }))"
      />
      <WorkspaceDataframeLayout
        :key="selectedDataframe"
        ref="dataframeLayout"
        @close="(index: number) => dataframes.splice(index, 1)"
      />
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import type { Client, Source } from 'blurr/build/main/types';

import DataframeLayout from '@/components/Workspace/DataframeLayout.vue';
import { DataframeObject, PreviewData } from '@/types/dataframe';
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
import { compareObjects, throttleOnce } from '@/utils';
import { preliminaryProfile } from '@/utils/blurr';

const blurrPackage = useBlurr();

let blurr: Client;

const dataframeLayout = ref<InstanceType<typeof DataframeLayout> | null>(null);

const dataframes = ref<DataframeObject[]>([]);

const selectedDataframe = ref(-1);

const appStatus = ref<AppStatus>('loading');
provide('app-status', appStatus);

const showSidebar = ref(false);
provide('show-sidebar', showSidebar);

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

const dataframeObject = computed(() => {
  return selectedDataframe.value >= 0
    ? dataframes.value[selectedDataframe.value]
    : undefined;
});
provide('dataframe-object', dataframeObject);

const previewData = ref<PreviewData | null>(null);
provide('preview-data', previewData);

const scrollRange = ref([0, 0]);
provide('scroll-range', scrollRange);

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

const preparePayload = (payload: Payload) => {
  if (payload.options.saveToNewDataframe) {
    payload.options.sourceId =
      dataframes.value.length.toString() + (+new Date()).toString();
  }

  if (payload.options.usesInputDataframe) {
    const currentDataframe = dataframes.value[selectedDataframe.value];
    payload.source = currentDataframe.df.copy();
    console.log('[DEBUG] Using dataframe:', { payload, currentDataframe });
    payload.options.sourceId = currentDataframe.sourceId;
  }

  if (payload.options.usesInputCols) {
    payload.cols = selection.value?.columns;
  }

  return payload;
};

const prepareOperation = () => {
  const operation = isOperation(state.value) ? state.value : null;

  if (!operation) {
    return { operation: null, payload: null };
  }

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

  return { operation, payload: preparePayload(payload) };
};

const getPreviewColumns = (sampleColumns: { title: string }[]) => {
  return sampleColumns
    .map(({ title }: { title: string }) => ({
      title,
      preview: !dataframeObject.value?.profile?.columns[title]
    }))
    .reduce(
      (acc, { title, preview }) => ({ ...acc, [title]: { preview } }),
      {}
    );
};

const operationActions: OperationActions = {
  submitOperation: async () => {
    try {
      appStatus.value = 'busy';

      const { operation, payload } = prepareOperation();

      if (operation) {
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
    previewData.value = null;
  },
  cancelOperation: () => {
    console.info('Operation cancelled');
    operationValues.value = {};
    state.value = 'operations';
    previewData.value = null;
  }
};

provide('operation-actions', operationActions);

const previewOperation = throttleOnce(async function () {
  try {
    appStatus.value = 'busy';

    const { operation, payload } = prepareOperation();

    if (!operation || !isOperation(operation) || !payload?.options?.preview) {
      appStatus.value = 'ready';
      return;
    }

    let firstSampleSource: Source | null = null;

    const start = scrollRange.value?.[0] || 0;
    const stop = scrollRange.value?.[1] || 50;

    if (payload.source) {
      firstSampleSource = await payload.source.iloc({
        target: 'operation_first_preview_df',
        lower_bound: start,
        upper_bound: stop
      });

      const firstSampleResult = await operation
        .action({
          ...payload,
          source: firstSampleSource,
          blurr
        })
        .columnsSample();

      // clear chunks

      dataframeLayout.value?.clearChunks(false);

      // use preview columns instead of source columns

      previewData.value = {
        options: { usesInputDataframe: true },
        columns: getPreviewColumns(firstSampleResult.columns),
        type: payload.options.preview
      };

      // add first chunk to dataframe

      dataframeLayout.value?.addChunk({
        start,
        stop,
        data: firstSampleResult.value
      });
    } else {
      previewData.value = {
        options: { usesInputDataframe: false },
        type: payload.options.preview
      };
    }

    // get profile for preview columns

    const result = await operation.action({
      ...payload,
      source: payload.source,
      target: 'operation_preview_' + (payload.source?.name || 'load_df'),
      blurr
    });

    // save preview dataframe

    previewData.value = {
      ...previewData.value,
      df: result
    };

    // save profile

    previewData.value = {
      ...previewData.value,
      profile: await preliminaryProfile(result)
    };

    const profilePromise = payload.source
      ? result.profile({
          cols: Object.entries(previewData.value?.columns || {})
            ?.filter(([_, { preview }]) => preview)
            .map(([title, _]) => title)
        })
      : result.profile({ cols: '*' });

    previewData.value = {
      ...previewData.value,
      profile: await profilePromise
    };

    appStatus.value = 'ready';
  } catch (err) {
    console.error('Error executing preview operation', err);
    previewData.value = null;
    appStatus.value = 'ready'; // 'error';
  }
}, 500);

watch(() => operationValues.value, previewOperation, { deep: true });
watch(() => selection.value, previewOperation, { deep: true });
</script>

<style lang="scss">
.workspace-container {
  height: 100vh;
  width: 100vw;
  display: grid;
  grid-template-columns: 1fr minmax(180px, 420px);
  grid-template-rows: min-content 1fr min-content;
  gap: 0px 0px;
  grid-auto-flow: row;
  grid-template-areas:
    'tabs toolbar'
    'table operations'
    'footer footer';
}

.hide-operations {
  grid-template-areas:
    'tabs toolbar'
    'table table'
    'footer footer';

  aside {
    display: none;
  }
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
