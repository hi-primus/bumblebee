<template>
  <div class="workspace-container" :class="{ 'hide-operations': !showSidebar }">
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
        class="text-lg text-neutral-lighter font-bold"
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
        <AppButton class="size-large color-primary-light" @click="loadFromFile">
          Load from file
        </AppButton>
      </div>
    </WorkspaceDataframeLayout>
  </div>
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
  OperationItem,
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

const { confirm } = useConfirmPopup();

let blurr: Client;

const dataframeLayout = ref<InstanceType<typeof DataframeLayout> | null>(null);

const dataframes = ref<DataframeObject[]>([]);
provide('dataframes', dataframes);

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

watch(state, () => {
  if (isOperation(state.value)) {
    operationValues.value = {
      options: deepClone(state.value.defaultOptions) as OperationOptions
    };
  }
});

const executedOperations = ref<OperationItem[]>([]);

const operationCells = ref<OperationItem[]>([]);
provide('operations', operationCells);

const inactiveOperationCells = ref<OperationItem[]>([]);
provide('inactive-operations', inactiveOperationCells);

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

const closeDataframe = async (tabIndex: number) => {
  if (tabs.value[tabIndex] >= 0) {
    const tabName = dataframes.value[tabs.value[tabIndex]].name;
    const close = await confirm(`Close '${tabName}'?`);
    if (!close) {
      return;
    }
  }
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

    setTimeout(async () => {
      const profileResult = await df.profile({
        bins: 33,
        requestOptions: { priority: PRIORITIES.profile }
      });
      dataframes.value[dataframeIndex].profile =
        profileResult as DataframeProfile;
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

const checkSources = (data: OperationItem[]) => {
  const sources = data.map(operation => operation.payload.options.sourceId);
  dataframes.value = dataframes.value.filter(
    dataframe => !dataframe.sourceId || sources.includes(dataframe.sourceId)
  );
};

const executeOperations = async () => {
  const data: OperationItem[] = operationCells.value;

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

const preparePayload = (
  payload: OperationPayload<PayloadWithOptions>
): OperationPayload<PayloadWithOptions> => {
  if (payload.options.saveToNewDataframe) {
    payload.options.sourceId = newSourceId();
  }

  if (payload.options.usesInputDataframe) {
    const currentDataframeIndex = tabs.value[selectedTab.value]; // TODO should be the source of the operation
    const currentDataframe = dataframes.value[currentDataframeIndex];
    if (currentDataframe) {
      payload.source = currentDataframe?.df;
      payload.options.sourceId = currentDataframe?.sourceId;
      console.log('[DEBUG] Using dataframe:', { payload, currentDataframe });
    }
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
  payload: OperationPayload<PayloadWithOptions> | null;
} => {
  const operation = isOperation(state.value)
    ? (state.value as Operation)
    : null;

  if (!operation) {
    return { operation: null, payload: null };
  }

  const { options, ...operationPayload } = operationValues.value;

  const operationOptions: OperationOptions = Object.assign(
    {},
    options,
    operation.defaultOptions
  );

  const payload = {
    options: operationOptions,
    ...operationPayload
  } as OperationPayload<PayloadWithOptions>;

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

      await blurr.backendServer.donePromise;

      if (operation) {
        if (payload?.options.oneTime) {
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

        console.log('[DEBUG] Submitting operation:', { operation, payload });

        const editingIndex = payload?.options?.editing;

        const newOperation = {
          operation,
          payload: {
            ...(payload || {}),
            options: {
              ...(payload?.options || {}),
              editing: undefined,
              preview: false
            }
          } as PayloadWithOptions
        };

        if (editingIndex !== undefined) {
          console.log('[DEBUG] Editing operation:', {
            editingIndex,
            newOperation
          });
          operationCells.value = [
            ...operationCells.value,
            ...inactiveOperationCells.value
          ];
          operationCells.value[editingIndex] = newOperation;
          inactiveOperationCells.value = [];
        } else {
          operationCells.value.push(newOperation);
        }
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
  cancelOperation: async (restoreInactive = false) => {
    console.info('Operation cancelled');
    previewOperationThrottled.cancel();
    dataframeLayout.value?.clearChunks(true, false);
    // const editing = operationValues.value.options?.editing;
    operationValues.value = {};
    state.value = 'operations';
    previewData.value = null;
    if (
      inactiveOperationCells.value.length > 0 &&
      restoreInactive /* && editing */
    ) {
      operationCells.value = [
        ...operationCells.value,
        ...inactiveOperationCells.value
      ];
      inactiveOperationCells.value = [];
      await new Promise(resolve => setTimeout(resolve, 0));
      await operationActions.submitOperation();
    }
  },
  selectOperation: async (
    operation: Operation | null = null,
    payload?: Partial<PayloadWithOptions>
  ) => {
    console.info('Operation selected');
    if (!operation) {
      operationActions.cancelOperation(false);
    }
    state.value = operation || 'operations';
    showSidebar.value = true;

    // awaits to allow the sidebar to be rendered

    await new Promise(resolve => setTimeout(resolve, 0));

    if (operation?.defaultOptions) {
      operationValues.value = {
        ...deepClone(payload),
        options: {
          ...operation.defaultOptions,
          ...(payload?.options || {})
        }
      };
    } else {
      operationValues.value = deepClone(payload) || {};
    }

    if (operationValues.value.options?.usesInputCols && payload?.cols) {
      selection.value = {
        columns: payload.cols,
        ranges: null,
        values: null,
        indices: null
      };
    }

    const currentDataframeIndex = tabs.value[selectedTab.value]; // TODO should be the source of the operation
    const currentDataframe = dataframes.value[currentDataframeIndex];

    operationValues.value.allColumns = Object.keys(
      currentDataframe?.profile?.columns || {}
    );

    operationValues.value.allDataframes = dataframes.value
      .filter((_, i) => i !== currentDataframeIndex)
      .map(dataframe => {
        return {
          name: dataframe.name,
          columns: Object.keys(dataframe.profile?.columns || {}),
          df: dataframe.df
        };
      });

    operationValues.value = operationValues.value || {};

    const resolve = (value: unknown) => {
      if (typeof value === 'function') {
        return value(operationValues.value);
      }
      return value;
    };

    operation?.fields.forEach(field => {
      // check if field has a default value

      if ('defaultValue' in field && field.defaultValue !== undefined) {
        operationValues.value[field.name] =
          operationValues.value[field.name] ||
          deepClone(resolve(field.defaultValue));
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
            defaultValue[subfield.name] = deepClone(
              resolve(subfield.defaultValue)
            );
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
          operationValues.value[field.name][i] =
            operationValues.value[field.name][i] || deepClone(defaultValue);
        }
      }
    });
  }
};

const loadFromFile = () => {
  const operation = operations.loadFromFile;
  if (operation) {
    operationActions.selectOperation(operation);
  }
};

const selectValuesOperation = (values: unknown[]) => {
  operationActions.selectOperation(operations.filterRows, {
    conditions: [{ condition: 'value_in', values: [...values] }],
    selectionFromPlot: true
  });
};

const selectRangesOperation = (ranges: [number, number][]) => {
  const optimizedRanges = ranges.reduce((acc, range) => {
    if (acc.length === 0) {
      acc.push(range);
    } else {
      const lastRange = acc[acc.length - 1];
      if (lastRange[1] === range[0]) {
        acc[acc.length - 1] = [lastRange[0], range[1]];
      } else {
        acc.push(range);
      }
    }
    return acc;
  }, [] as [number, number][]);

  operationActions.selectOperation(operations.filterRows, {
    conditions: optimizedRanges.map(range => ({
      condition: 'between',
      value: range[0] || '',
      otherValue: range[1] || ''
    })),
    selectionFromPlot: true
  });
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

      const operationOptions = Object.assign(
        {},
        payload.options,
        operation.defaultOptions
      );

      const usesInputDataframe =
        operationOptions.usesInputDataframe && payload.source;

      let previewColumnNames: string[] = [];

      if (usesInputDataframe) {
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

        previewColumnNames = Object.keys(previewColumns).filter(title =>
          title.startsWith('__bumblebee__preview__')
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

      const previewType = payload.options.preview;

      if (
        previewColumnNames.length ||
        !usesInputDataframe ||
        previewType === 'whole'
      ) {
        // save profile

        const preliminaryProfile = await getPreliminaryProfile(result);

        checkPreviewCancel();

        previewData.value = {
          ...previewData.value,
          profile: preliminaryProfile
        };

        await new Promise(resolve => setTimeout(resolve, 0));

        checkPreviewCancel();

        const previewColumns = Object.keys(
          previewData.value?.columns || {}
        ).filter(title => title.startsWith('__bumblebee__preview__'));

        let profile: DataframeProfile | null = null;

        if (
          previewType === 'whole' ||
          !payload.source ||
          !previewColumns.length
        ) {
          profile = await result.profile({
            cols: '*',
            bins: 33,
            requestOptions: { priority: PRIORITIES.previewProfile }
          });
        }

        if (previewType !== 'whole' && previewColumns.length) {
          profile = await result.profile({
            cols: previewColumns,
            bins: 33,
            requestOptions: { priority: PRIORITIES.previewProfile }
          });
        }

        if (profile) {
          checkPreviewCancel();

          previewData.value = {
            ...previewData.value,
            profile
          };
        }
      }

      if (appStatus.value === 'busy') {
        appStatus.value = 'ready';
      }

      operationStatus.value = {
        status: 'ok'
      };
    } catch (err) {
      console.error('Error executing preview operation.', err);
      if (appStatus.value === 'busy') {
        appStatus.value = 'ready';
      }
      if (err instanceof Error && !err.message.includes('Preview cancelled')) {
        previewData.value = null;
        operationStatus.value = {
          message: err.message,
          status: 'error'
        };
      } else if (typeof err === 'string') {
        previewData.value = null;
        operationStatus.value = {
          message: err
            .split('\n')
            .filter(l => l)
            .pop(),
          status: 'error'
        };
      } else {
        operationStatus.value = {
          message: 'Error executing preview operation',
          status: 'error'
        };
      }
    }
  },
  {
    limit: 500,
    delay: 500,
    cancellable: true
  }
);

const previewOperation = async () => {
  if (getOperationUsesPreview()) {
    try {
      operationStatus.value = {
        status: 'not validated'
      };

      await blurr.backendServer.donePromise;

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
watch(
  () => selection.value,
  selection => {
    if (
      isOperation(state.value) &&
      !isOperation(state.value, operations.filterRows)
    ) {
      return previewOperation();
    }

    if (selection?.values?.length) {
      selectValuesOperation(selection.values);
    } else if (selection?.ranges?.length) {
      selectRangesOperation(selection.ranges);
    } else if (isOperation(state.value)) {
      previewOperation();
    } else {
      state.value = {
        columns: selection?.columns || []
      };
    }
  },
  { deep: true }
);

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
  dataframeLayout.value?.clearChunks(false, false, true);
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
