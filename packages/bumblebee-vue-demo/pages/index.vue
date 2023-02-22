<template>
  <NuxtLayout>
    <div
      class="workspace-container"
      :class="{ 'hide-operations': !showSidebar }"
    >
      <Tabs
        v-model:selected="selectedTab"
        :tabs="tabs.map(({ name }) => ({ label: name }))"
        @close="(index: number) => closeDataframe(index)"
      />
      <WorkspaceDataframeLayout ref="dataframeLayout">
        <div
          v-if="dataSourcesFromCells.length > 0"
          class="text-lg text-text-lighter font-bold"
        >
          <span> Load from existing data sources: </span>
          <span v-for="(source, index) in dataSourcesFromCells" :key="index">
            <span v-if="index > 0">, </span>
            <button
              type="button"
              class="text-primary"
              @click="loadDataSource(source.sourceId)"
            >
              {{ source.name || index + 1 }}
            </button>
          </span>
        </div>
        <div class="flex justify-center items-center gap-2">
          <AppButton
            class="btn-size-large btn-color-primary-light"
            @click="loadFromFile"
          >
            Load from file
          </AppButton>
        </div>
      </WorkspaceDataframeLayout>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import type { Client, Source } from 'blurr/build/main/types';

import DataframeLayout from '@/components/Workspace/DataframeLayout.vue';
import { DataframeObject, PreviewData } from '@/types/dataframe';
import {
  isOperation,
  Operation,
  OperationActions,
  OperationOptions,
  OperationPayload,
  PayloadWithOptions,
  State,
  TableSelection
} from '@/types/operations';
import { AppStatus } from '@/types/workspace';
import { compareObjects, deepClone, throttleOnce } from '@/utils';
import { getPreliminaryProfile } from '@/utils/blurr';
import { operations } from '@/utils/operations';

const blurrPackage = useBlurr();

const { addToast } = useToasts();

let blurr: Client;

const dataframeLayout = ref<InstanceType<typeof DataframeLayout> | null>(null);

const dataframes = ref<DataframeObject[]>([]);

const tabs = computed(() => dataframes.value.filter(d => d.loaded));

const selectedTab = ref(-1);

const appStatus = ref<AppStatus>('loading');
provide('app-status', appStatus);

const showSidebar = ref(false);
provide('show-sidebar', showSidebar);

const state = ref<State>('operations');
provide('state', state);

const selection = ref<TableSelection>(null);
provide('selection', selection);

const dataframeObject = computed(() => {
  return selectedTab.value >= 0 ? tabs.value[selectedTab.value] : undefined;
});
provide('dataframe-object', dataframeObject);

const previewData = ref<PreviewData | null>(null);
provide('preview-data', previewData);

const scrollRange = ref([0, 0]);
provide('scroll-range', scrollRange);

watch(
  () => state.value,
  state => {
    if (isOperation(state)) {
      operationValues.value = {
        options: Object.assign({}, state.defaultOptions)
      };
    }
  }
);

const executedOperations = ref<OperationPayload[]>([]);

const operationCells = ref<OperationPayload[]>([]);
provide('operations', operationCells);

const operationValues = ref<Partial<PayloadWithOptions>>({});
provide('operation-values', operationValues);

const dataSourcesFromCells = computed<{ sourceId: string; name: string }[]>(
  () => {
    return dataframes.value
      .filter(dataframe => dataframe.sourceId && !dataframe.loaded)
      .map(dataframe => {
        return {
          sourceId: dataframe.sourceId,
          name: dataframe?.name || ''
        };
      });
  }
);

const closeDataframe = (tabIndex: number) => {
  const index = dataframes.value.findIndex(
    dataframe => dataframe.sourceId === tabs.value[tabIndex].sourceId
  );
  if (selectedTab.value >= tabIndex) {
    selectedTab.value = selectedTab.value - 1;
  }
  dataframes.value[index].loaded = false;
};

const newSourceId = () => {
  return dataframes.value.length.toString() + (+new Date()).toString();
};

const handleDataframeResults = async (
  result: unknown,
  payload: PayloadWithOptions
) => {
  if (payload.options.targetType === 'dataframe') {
    const df = result as Source;
    let sourceId = payload.options.sourceId;

    let dataframeIndex = sourceId
      ? dataframes.value.findIndex(dataframe => dataframe.sourceId === sourceId)
      : -1;

    const createDataframe =
      dataframeIndex < 0 && payload.options.saveToNewDataframe;

    if (createDataframe) {
      sourceId = sourceId || newSourceId();
      const newDataframe: DataframeObject = {
        name: 'dataset',
        sourceId,
        df,
        profile: undefined,
        loaded: true,
        updates: 0
      };
      dataframes.value.push(newDataframe);
      const newLength = dataframes.value.length;
      dataframeIndex = newLength - 1;
      console.log(
        '[DEBUG] Creating dataframe:',
        dataframes.value[dataframeIndex]
      );
      const newTabLength = tabs.value.length;
      selectedTab.value = newTabLength - 1;
    } else {
      if (dataframeIndex < 0) {
        console.error('Could not find dataframe to update', sourceId);
        return;
      }
      const currentDataframe = dataframes.value[dataframeIndex];
      currentDataframe.df = df;
      currentDataframe.updates = (currentDataframe.updates || 0) + 1;
      console.log('[DEBUG] Updating dataframe:', currentDataframe);
      dataframes.value[dataframeIndex] = currentDataframe;
    }

    dataframes.value[dataframeIndex].profile = await getPreliminaryProfile(df);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    df.profile({ bins: 33 }).then((profile: any) => {
      dataframes.value[dataframeIndex].profile = profile;
    });
  } else {
    console.error('Unknown result type', result);
    // TODO: Handle other types of targets
  }
};

/**
 * Filters out the dataframes that are no longer needed.
 * @param data The next list of operations.
 */

const checkSources = (data: OperationPayload[]) => {
  const sources = data.map(operation => operation.payload.options.sourceId);
  dataframes.value = dataframes.value.filter(
    dataframe => !dataframe.sourceId || sources.includes(dataframe.sourceId)
  );
};

const executeOperations = async () => {
  const data = operationCells.value;

  checkSources(data);

  console.log('[DEBUG] Executing operations:', data, executedOperations.value);

  let skip = executedOperations.value.length < data.length;

  for (let i = 0; i < data.length; i++) {
    if (
      skip &&
      executedOperations.value.length > i &&
      !compareObjects(data[i], executedOperations.value[i])
    ) {
      skip = false;
      break;
    }
  }

  const operationResults = new Map<
    string,
    { result: unknown; payload: PayloadWithOptions }
  >();

  for (let i = 0; i < data.length; i++) {
    // Skip operations that have already been executed
    if (skip && i < executedOperations.value.length) {
      continue;
    }

    const { operation, payload } = data[i];

    if (!isOperation(operation)) {
      throw new Error('Invalid operation', { cause: operation });
    }
    const result = await operation.action({
      ...payload,
      blurr,
      app: { addToast }
    });

    if (
      payload.options.sourceId &&
      payload.options.targetType === 'dataframe'
    ) {
      operationResults.set(payload.options.sourceId, { result, payload });
    }
    console.info('Operation result:', { result, payload });
  }

  const promisesResults = await Promise.allSettled(
    Array.from(operationResults.values()).map(({ result, payload }) =>
      handleDataframeResults(result, payload)
    )
  );

  promisesResults.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(
        `Error while handling operation result #${index}: ${result.reason}`
      );
    }
  });

  executedOperations.value = [...data];
};

const preparePayload = (payload: PayloadWithOptions): PayloadWithOptions => {
  if (payload.options.saveToNewDataframe) {
    payload.options.sourceId = newSourceId();
  }

  if (payload.options.usesInputDataframe) {
    const currentDataframe = tabs.value[selectedTab.value]; // TODO should be the source of the operation
    payload.source = currentDataframe.df.copy();
    console.log('[DEBUG] Using dataframe:', { payload, currentDataframe });
    payload.options.sourceId = currentDataframe.sourceId;
  }

  if (payload.options.usesInputCols) {
    payload.cols = selection.value?.columns || [];

    // If the operation only accepts a single column, we only send the first one
    // TODO: Disallow selecting single column operations when multiple columns are selected

    if (
      payload.options.usesInputCols === 'single' &&
      selection.value?.columns &&
      selection.value?.columns.length > 1
    ) {
      selection.value.columns = [selection.value.columns[0]];
      payload.cols = selection.value.columns;
    }
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

  const payload: PayloadWithOptions = {
    options: operationOptions,
    ...operationPayload
  };

  return { operation, payload: preparePayload(payload) };
};

const operationActions: OperationActions = {
  submitOperation: async () => {
    try {
      if (appStatus.value === 'ready') {
        appStatus.value = 'busy';
      }

      const { operation, payload } = prepareOperation();

      if (operation) {
        if (payload.options.oneTime) {
          await operation.action({
            ...payload,
            options: {
              ...payload.options,
              preview: false
            },
            blurr,
            app: { addToast }
          });
          operationValues.value = {};
          state.value = 'operations';
          if (appStatus.value === 'busy') {
            appStatus.value = 'ready';
          }
          return;
        }

        operationCells.value.push({
          operation,
          payload: {
            ...payload,
            options: {
              ...payload.options,
              preview: false
            }
          }
        });
      }

      await executeOperations();

      dataframeLayout.value?.clearChunks(true, false);

      operationValues.value = {};
      state.value = 'operations';
      if (appStatus.value === 'busy') {
        appStatus.value = 'ready';
      }
    } catch (err) {
      console.error('Error executing operation.', err); // TODO: show error in UI
      dataframeLayout.value?.clearChunks(true, false);
      if (appStatus.value === 'busy') {
        appStatus.value = 'ready';
      }
    }
    previewData.value = null;
  },
  cancelOperation: () => {
    console.info('Operation cancelled');
    dataframeLayout.value?.clearChunks(true, false);
    operationValues.value = {};
    state.value = 'operations';
    previewData.value = null;
  },
  selectOperation: async (operation: Operation | null = null) => {
    console.info('Operation selected');
    if (!operation) {
      operationActions.cancelOperation();
    }
    state.value = operation || 'operations';
    showSidebar.value = true;

    // awaits to allow the sidebar to be rendered

    await new Promise(resolve => setTimeout(resolve, 0));

    if (operation?.defaultOptions) {
      operationValues.value = {
        options: operation.defaultOptions
      };
    }

    operation?.fields.forEach(field => {
      // check if field has a default value

      if ('defaultValue' in field && field.defaultValue !== undefined) {
        operationValues.value = operationValues.value || {};
        operationValues.value[field.name] = deepClone(field.defaultValue);
      }

      // check if field is a group

      if ('fields' in field && field.fields) {
        const defaultValue =
          operationValues.value[`default-${field.name}`] || {};
        for (const subfield of field.fields) {
          if (
            'defaultValue' in subfield &&
            subfield.defaultValue !== undefined
          ) {
            defaultValue[subfield.name] = deepClone(subfield.defaultValue);
          }
        }
        operationValues.value[`default-${field.name}`] = defaultValue;
        const defaultFields =
          'defaultFields' in field && field.defaultFields !== undefined
            ? field.defaultFields || 0
            : 1;
        operationValues.value[field.name] =
          operationValues.value[field.name] || [];
        for (let i = 0; i < defaultFields; i++) {
          operationValues.value[field.name][i] = deepClone(defaultValue);
        }
      }
    });
  }
};

const loadFromFile = () => {
  const operation = operations.find(o => o.key === 'loadFromFile');
  if (operation) {
    operationActions.selectOperation(operation);
  }
};

const loadDataSource = (sourceId: string) => {
  // find sourceId index in dataframes
  const foundIndex = dataframes.value.findIndex(df => df.sourceId === sourceId);
  if (foundIndex !== -1) {
    dataframes.value[foundIndex].loaded = true;
    const foundTabIndex = tabs.value.findIndex(
      tab => tab.sourceId === sourceId
    );
    selectedTab.value = foundTabIndex;
  }
};

provide('operation-actions', operationActions);

const previewOperation = throttleOnce(async function () {
  try {
    if (appStatus.value === 'ready') {
      appStatus.value = 'busy';
    }

    const { operation, payload } = prepareOperation();

    if (!operation || !isOperation(operation) || !payload?.options?.preview) {
      if (appStatus.value === 'busy') {
        appStatus.value = 'ready';
      }
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

      const firstSampleDataframe = (await operation.action({
        ...deepClone(payload),
        source: firstSampleSource,
        blurr,
        app: { addToast }
      })) as Source;

      const firstSampleResult = await firstSampleDataframe.columnsSample();

      // use preview columns instead of source columns

      const previewColumns = Object.fromEntries(
        firstSampleResult.columns.map(({ title }: { title: string }) => {
          return [title, {}];
        })
      );

      previewData.value = {
        options: { usesInputDataframe: true },
        columns: previewColumns,
        type: payload.options.preview
      };

      // clear chunks

      dataframeLayout.value?.clearChunks(true, false);
      dataframeLayout.value?.setChunksLoading(false);

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

      // clear chunks

      dataframeLayout.value?.clearChunks(true, false);
      dataframeLayout.value?.setChunksLoading(false);
    }

    // get profile for preview columns

    const result = await operation.action({
      ...deepClone(payload),
      source: payload.source,
      target: 'operation_preview_' + (payload.source?.name || 'load_df'),
      blurr,
      app: { addToast }
    });

    if (!result) {
      throw new Error(`Operation '${operation.name}' returned no result.`, {
        cause: { operation, payload }
      });
    }

    // save preview dataframe

    previewData.value = {
      ...previewData.value,
      df: result
    };

    dataframeLayout.value?.setChunksLoading(true);

    // save profile

    const preliminaryProfile = await getPreliminaryProfile(result);

    previewData.value = {
      ...previewData.value,
      profile: preliminaryProfile
    };

    const profile = await (payload.source
      ? result.profile({
          cols: Object.entries(previewData.value?.columns || {})
            ?.map(([title, _]) => title)
            .filter(title => title.startsWith('__bumblebee__preview__')),
          bins: 33
        })
      : result.profile({ cols: '*', bins: 33 }));

    previewData.value = {
      ...previewData.value,
      profile
    };

    if (appStatus.value === 'busy') {
      appStatus.value = 'ready';
    }
  } catch (err) {
    console.error('Error executing preview operation.', err); // TODO: show error in UI
    previewData.value = null;
    if (appStatus.value === 'busy') {
      appStatus.value = 'ready';
    }
  }
}, 500);

watch(() => operationValues.value, previewOperation, { deep: true });
watch(() => selection.value, previewOperation, { deep: true });

watch(showSidebar, show => {
  if (!show) {
    dataframeLayout.value?.focusTable();
  }
});

watch(selectedTab, tab => {
  if (tab >= 0 && !tabs.value[tab]) {
    selectedTab.value = -1;
  }
});

const initializeEngine = async () => {
  try {
    const { Blurr } = blurrPackage;
    blurr = Blurr({
      serverOptions: {
        scriptURL: 'https://cdn.jsdelivr.net/pyodide/v0.22.1/full/pyodide.js',
        useWorker: true
      }
    });
    window.blurr = blurr;
    await blurr.backendServer.donePromise;
    const result = await blurr.runCode("'successfully loaded'");
    console.info('Initialization result:', result);
  } catch (err) {
    console.error('Error initializing blurr.', err);
    appStatus.value = 'error';
  }

  if (appStatus.value === 'loading') {
    appStatus.value = 'ready';
  }
};

provide('initializeEngine', initializeEngine);

onMounted(async () => {
  await initializeEngine();
});
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
