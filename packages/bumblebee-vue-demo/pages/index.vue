<template>
  <NuxtLayout>
    <div
      class="workspace-container"
      :class="{ 'hide-operations': !showSidebar }"
    >
      <Tabs
        v-model:selected="selectedTab"
        :tabs="
          tabs.map(tab => ({
            label: tab >= 0 ? dataframes[tab]?.name : '(new dataset)'
          }))
        "
        addable
        @close="(index: number) => closeDataframe(index)"
        @add="
          () => {
            tabs.push(-1);
            selectedTab = tabs.length - 1;
          }
        "
      />
      <WorkspaceDataframeLayout ref="dataframeLayout">
        <div
          v-if="availableDataframes.length > 0"
          class="text-lg text-text-lighter font-bold"
        >
          <span> Load from existing data sources: </span>
          <span v-for="(tabIndex, index) in availableDataframes" :key="index">
            <span v-if="index > 0">, </span>
            <button
              type="button"
              class="text-primary"
              @click="loadDataSource(tabIndex)"
            >
              {{ dataframes[tabIndex].name || index + 1 }}
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
import DataframeLayout from '@/components/Workspace/DataframeLayout.vue';
import { AppStatus } from '@/types/app';
import { Client, Source } from '@/types/blurr';
import {
  DataframeObject,
  DataframeProfile,
  PreviewColumn,
  PreviewData
} from '@/types/dataframe';
import {
  isOperation,
  Operation,
  OperationActions,
  OperationOptions,
  OperationPayload,
  OperationStatus,
  PayloadWithOptions,
  State,
  TableSelection
} from '@/types/operations';
import { compareObjects, deepClone, getNameFromFileName } from '@/utils';
import { getPreliminaryProfile, PRIORITIES } from '@/utils/blurr';
import { operations } from '@/utils/operations';
import { throttleOnce } from '@/utils/time';

const blurrPackage = useBlurr();

const { addToast } = useToasts();

let blurr: Client;

const dataframeLayout = ref<InstanceType<typeof DataframeLayout> | null>(null);

const dataframes = ref<DataframeObject[]>([]);

const tabs = ref<number[]>([]);

const selectedTab = ref(-1);

const appStatus = ref<AppStatus>('loading');
provide('app-status', appStatus);

const showSidebar = ref(false);
provide('show-sidebar', showSidebar);

const state = ref<State>('operations');
provide('state', state);

const selection = ref<TableSelection>(null);
provide('selection', selection);

const dataframeObject = computed<DataframeObject | undefined>(() => {
  return selectedTab.value >= 0
    ? dataframes.value[tabs.value[selectedTab.value]]
    : undefined;
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

const operationStatus = ref<OperationStatus>({
  status: 'not validated'
});
provide('operation-status', operationStatus);

const availableDataframes = computed<number[]>(() => {
  return dataframes.value
    .map((_, index) => index)
    .filter(index => !tabs.value.includes(index));
});

const closeDataframe = (tabIndex: number) => {
  if (selectedTab.value >= tabIndex) {
    selectedTab.value = selectedTab.value - 1;
  }
  tabs.value.splice(tabIndex, 1);
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
        updates: 0
      };
      dataframeIndex = dataframes.value.push(newDataframe) - 1;
      loadDataSource(dataframeIndex);
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

    const profile = await getPreliminaryProfile(df);

    const dataframeName =
      profile.name || getNameFromFileName(profile.file_name || '');

    dataframes.value[dataframeIndex] = {
      ...dataframes.value[dataframeIndex],
      profile,
      name: dataframeName || 'dataset'
    };

    setTimeout(() => {
      df.profile({
        bins: 33,
        requestOptions: { priority: PRIORITIES.profile }
      }).then(profile => {
        dataframes.value[dataframeIndex].profile = profile as DataframeProfile;
      });
    }, 0);
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
      addToast({
        title: 'Error while handling result of operation',
        message: [
          `Error on operation of index ${index}`,
          result.reason as string
        ],
        type: 'error'
      });
      console.error(
        `Error while handling result of operation of index ${index}: ${result.reason}`
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
    const currentDataframeIndex = tabs.value[selectedTab.value]; // TODO should be the source of the operation
    const currentDataframe = dataframes.value[currentDataframeIndex];
    payload.source = currentDataframe.df;
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

const getPreparedOperation = (): {
  operation: Operation | null;
  payload: PayloadWithOptions | null;
} => {
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

const getOperationUsesPreview = (): boolean => {
  const { operation, payload } = getPreparedOperation();

  return Boolean(isOperation(operation) && payload?.options?.preview);
};

const operationActions: OperationActions = {
  submitOperation: async () => {
    try {
      if (appStatus.value === 'ready') {
        appStatus.value = 'busy';
      }

      const { operation, payload } = getPreparedOperation();

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
      addToast({
        title: 'Error executing operation',
        error: err,
        type: 'error'
      });
      console.error('Error executing operation.', err);
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

    const currentDataframeIndex = tabs.value[selectedTab.value]; // TODO should be the source of the operation
    const currentDataframe = dataframes.value[currentDataframeIndex];

    operationValues.value.allColumns = Object.keys(
      currentDataframe.profile?.columns || {}
    );

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

const loadDataSource = (dataframeIndex: number) => {
  if (!dataframes.value[dataframeIndex]) {
    return;
  }
  const foundTabIndex = tabs.value.indexOf(dataframeIndex);
  if (foundTabIndex >= 0) {
    selectedTab.value = foundTabIndex;
  } else {
    const availableIndex = tabs.value.findIndex(tab => tab <= -1);
    if (availableIndex >= 0) {
      tabs.value[availableIndex] = dataframeIndex;
      selectedTab.value = availableIndex;
    } else {
      selectedTab.value = tabs.value.push(dataframeIndex) - 1;
    }
  }
};

provide('operation-actions', operationActions);

let cancelPreview = false;

const checkPreviewCancel = () => {
  if (cancelPreview) {
    cancelPreview = false;
    throw new Error('Preview cancelled');
  }
};

const previewOperationThrottled = throttleOnce(
  async function () {
    try {
      operationStatus.value = {
        status: 'not validated'
      };

      cancelPreview = false;

      if (appStatus.value === 'ready') {
        appStatus.value = 'busy';
      }

      const { operation, payload } = getPreparedOperation();

      if (!operation || !isOperation(operation) || !payload?.options?.preview) {
        if (appStatus.value === 'busy') {
          appStatus.value = 'ready';
        }
        operationStatus.value = {
          status: 'ok'
        };
        return;
      }

      let firstSampleSource: Source | null = null;

      const start = scrollRange.value?.[0] || 0;
      const stop = scrollRange.value?.[1] || 50;

      if (payload.source) {
        checkPreviewCancel();

        firstSampleSource = await payload.source.iloc({
          target: 'operation_first_preview_df',
          lower_bound: start,
          upper_bound: stop
        });

        checkPreviewCancel();

        const firstSampleDataframe = (await operation.action({
          ...deepClone(payload),
          source: firstSampleSource,
          blurr,
          app: { addToast }
        })) as Source;

        checkPreviewCancel();

        const firstSampleResult = await firstSampleDataframe.columnsSample({
          requestOptions: { priority: PRIORITIES.previewSample }
        });

        checkPreviewCancel();

        // use preview columns instead of source columns

        const previewColumns = Object.fromEntries(
          firstSampleResult.columns.map(({ title }: { title: string }) => {
            return [title, {} as PreviewColumn];
          })
        );

        previewData.value = {
          options: { usesInputDataframe: true },
          columns: previewColumns,
          type: payload.options.preview
        };

        // clear chunks

        dataframeLayout.value?.setChunksLoading(false);
        dataframeLayout.value?.clearChunks(true, false);

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

      checkPreviewCancel();

      const result = await operation.action({
        ...deepClone(payload),
        source: payload.source,
        target: 'operation_preview_' + (payload.source?.name || 'load_df'),
        blurr,
        app: { addToast }
      });

      checkPreviewCancel();

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

      checkPreviewCancel();

      previewData.value = {
        ...previewData.value,
        profile: preliminaryProfile
      };

      await new Promise(resolve => setTimeout(resolve, 0));

      checkPreviewCancel();

      const profile = await (payload.source
        ? result.profile({
            cols: Object.entries(previewData.value?.columns || {})
              ?.map(([title, _]) => title)
              .filter(title => title.startsWith('__bumblebee__preview__')),
            bins: 33,
            requestOptions: { priority: PRIORITIES.previewProfile }
          })
        : result.profile({
            cols: '*',
            bins: 33,
            requestOptions: { priority: PRIORITIES.previewProfile }
          }));

      checkPreviewCancel();

      previewData.value = {
        ...previewData.value,
        profile
      };

      if (appStatus.value === 'busy') {
        appStatus.value = 'ready';
      }

      operationStatus.value = {
        status: 'ok'
      };
    } catch (err) {
      console.error('Error executing preview operation.', err); // TODO: show error in UI
      if (appStatus.value === 'busy') {
        appStatus.value = 'ready';
      }
      if (err instanceof Error && !err.message.includes('Preview cancelled')) {
        previewData.value = null;
        operationStatus.value = {
          message: err.message,
          status: err instanceof PreviewError ? 'warning' : 'error'
        };
      }
    }
  },
  {
    limit: 500,
    delay: 500,
    cancelable: true
  }
);

const previewOperation = async () => {
  if (getOperationUsesPreview()) {
    try {
      operationStatus.value = {
        status: 'not validated'
      };
      const result = await previewOperationThrottled();
      if (result instanceof Error) {
        throw result;
      }
    } catch (err) {
      // this is needed to cancel the preview operation in the middle of the execution
      cancelPreview = true;
    }
  } else {
    operationStatus.value = {
      status: 'ok'
    };
  }
};

watch(() => operationValues.value, previewOperation, { deep: true });
watch(() => selection.value, previewOperation, { deep: true });

watch(showSidebar, show => {
  if (!show) {
    dataframeLayout.value?.focusTable();
  }
});

watch(selectedTab, async tab => {
  await nextTick();
  if (tab >= 0 && tabs.value[tab] === undefined) {
    const lastTab = tabs.value.reverse().findIndex(tab => tab !== -1);
    if (lastTab >= 0) {
      selectedTab.value = lastTab;
    } else {
      selectedTab.value = tabs.value.length - 1;
    }
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
