<template>
  <div class="workspace-container" :class="{ 'hide-operations': !sidebar }">
    <div class="top-section flex items-end gap-4">
      <slot name="header"></slot>
      <Tabs
        v-model:selected="selectedTab"
        :tabs="
          tabs.map(tab => ({
            label: tab >= 0 ? dataframes[tab]?.name : undefined
          }))
        "
        class="pl-4"
        :class="{
          'pointer-events-none opacity-50':
            appSettings.workspaceMode && appStatus !== 'ready'
        }"
        closable
        addable
        @close="(index: number) => closeDataframe(index)"
        @add="
          () => {
            tabs.push(-1);
            selectedTab = tabs.length - 1;
          }
        "
      />
    </div>
    <WorkspaceToolbar
      :class="{
        'pointer-events-none opacity-50':
          appSettings.workspaceMode && appStatus === 'loading'
      }"
    />
    <WorkspaceDataframeLayout ref="dataframeLayout">
      <div v-if="appSettings.workspaceMode && appStatus === 'loading'">
        <Icon
          :path="mdiLoading"
          class="w-12 h-12 text-neutral-lighter animate-spin"
        />
      </div>
      <template v-else>
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
          <AppButton
            class="size-large color-primary-light"
            @click="loadFromFile"
          >
            Load from file
          </AppButton>
        </div>
      </template>
    </WorkspaceDataframeLayout>
    <WorkspaceOperations />
    <WorkspaceFooter />
  </div>
</template>

<script setup lang="ts">
import { mdiLoading } from '@mdi/js';
import { UploadFileResponse } from '@nhost/hasura-storage-js';

import DataframeLayout from '@/components/Workspace/DataframeLayout.vue';
import {
  AppSettings,
  AppStatus,
  CommandData,
  FileWithId,
  TabData,
  WorkspaceData
} from '@/types/app';
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
import {
  compareObjects,
  deepClone,
  fillColumns,
  getNameFromFileName,
  getUniqueName
} from '@/utils';
import { getPreliminaryProfile, PRIORITIES } from '@/utils/blurr';
import { FieldsError, operations } from '@/utils/operations';
import { throttleOnce } from '@/utils/time';

const blurrPackage = useBlurr();

const { addToast } = useToasts();

const { confirm } = useConfirmPopup();

type Emits = {
  (event: 'update:data', data: WorkspaceData): void;
};

const props = defineProps({
  data: {
    type: Object as PropType<WorkspaceData>,
    default: null
  }
});

const emit = defineEmits<Emits>();

const blurr = ref<Client | null>(null);
provide('blurr', blurr);

const appSettings = ref<AppSettings>({
  openAiApiKey: '',
  workspaceMode: false
});
provide('app-settings', appSettings);

const dataframeLayout = ref<InstanceType<typeof DataframeLayout> | null>(null);

const dataframes = ref<DataframeObject[]>([]);
provide('dataframes', dataframes);

const tabs = ref<number[]>([]);

const selectedTab = ref(-1);

const appStatus = ref<AppStatus>('loading');
provide('app-status', appStatus);

const sidebar = ref<null | 'operations' | 'selection'>(null);
provide('show-sidebar', sidebar);

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
    setOperationValues({
      options: state.value.defaultOptions as OperationOptions
    } as OperationPayload<PayloadWithOptions>);
  }
});

const executedOperations = ref<OperationItem[]>([]);
const sourcesFromOperations = ref<Record<string, Source>>({});

const operationItems = ref<OperationItem[]>([]);
provide('operations', operationItems);

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

const selectDataframe = (sourceId: string) => {
  const tabIndex = tabs.value.findIndex(
    index => dataframes.value[index].sourceId === sourceId
  );
  if (tabIndex >= 0) {
    selectedTab.value = tabIndex;
  }
};

provide('select-dataframe', selectDataframe);

const closeDataframe = async (tabIndex: number) => {
  if (tabs.value[tabIndex] >= 0) {
    const tabName = dataframes.value?.[tabs.value[tabIndex]]?.name;
    const close = await confirm(tabName ? `Close '${tabName}'?` : 'Close tab?');
    if (!close) {
      return;
    }
  }
  if (selectedTab.value >= tabIndex) {
    selectedTab.value = selectedTab.value - 1;
  }
  tabs.value.splice(tabIndex, 1);
};

const getNewSourceId = () => {
  return dataframes.value.length.toString() + (+new Date()).toString();
};

const handleDataframeResults = async (
  result: unknown,
  payload: PayloadWithOptions,
  changeTab = true
) => {
  if (payload.options.targetType === 'dataframe') {
    const df = result as Source;
    let sourceId = payload.options.newSourceId || payload.options.sourceId;
    const newSourceId = payload.options.newSourceId;

    let dataframeIndex = sourceId
      ? dataframes.value.findIndex(dataframe => dataframe.sourceId === sourceId)
      : -1;

    console.log('updateDataframe', dataframeIndex, {
      ...payload,
      options: { ...payload.options }
    });

    const createDataframe =
      dataframeIndex < 0 || payload.options.saveToNewDataframe;

    if (createDataframe) {
      sourceId = newSourceId || getNewSourceId();
      dataframeIndex = sourceId
        ? dataframes.value.findIndex(
            dataframe => dataframe.sourceId === sourceId
          )
        : -1;
      const newDataframe: DataframeObject = {
        name: 'dataset',
        sourceId,
        df,
        profile: undefined,
        updates: 0
      };
      if (dataframeIndex >= 0) {
        dataframes.value[dataframeIndex] = newDataframe;
      } else {
        dataframes.value.push(newDataframe);
        dataframeIndex = dataframes.value.length - 1;
      }
      if (changeTab) {
        loadDataSource(dataframeIndex);
      }
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

    let dataframeName =
      getNameFromFileName(profile.file_name || '') || profile.name;

    const names = dataframes.value
      .filter((_df, index) => index !== dataframeIndex)
      .map(df => df.name || '');

    if (names.includes(dataframeName)) {
      dataframeName = getUniqueName(dataframeName, names, true);
    }

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

      emitWorkspaceData();
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
  const sources = data.map(operation => operation.payload.options.newSourceId);
  dataframes.value = dataframes.value.filter(
    dataframe => !dataframe.sourceId || sources.includes(dataframe.sourceId)
  );
};

const nuxtApp = useNuxtApp();

// avoid using useNhostClient() to avoid errors on installations without nhost
const nhost = nuxtApp.$nhost;

const alreadyUploadedFiles: Record<string, UploadFileResponse> = {};

async function uploadFile(file: File | FileWithId): UploadFileResponse {
  if (!nhost) {
    return { error: 'Upload not available' };
  }

  if ('id' in file && file.id && alreadyUploadedFiles[file.id]) {
    console.log('[DEBUG] File already uploaded', file);
    return { ...alreadyUploadedFiles[file.id], error: null };
  }
  console.log('[DEBUG] Uploading file (id not found)', file);

  const { fileMetadata, error } = await nhost.storage.upload({
    file
  });

  if (!fileMetadata) {
    return { fileMetadata, error };
  }

  const filepath = nhost.storage.getPublicUrl({
    fileId: fileMetadata.id
  });

  if ('id' in file && file.id) {
    alreadyUploadedFiles[file.id] = { fileMetadata, filepath };
  }

  return { fileMetadata, filepath, error };
}

const getAppProperties = () => {
  return {
    blurr: blurr.value,
    settings: appSettings.value,
    addToast,
    ...(appSettings.value.workspaceMode ? { uploadFile } : {})
  };
};

const executeOperations = async (changeTab = true) => {
  const data: OperationItem[] = operationItems.value;

  checkSources(data);

  console.log('[DEBUG] Executing operations:', data, executedOperations.value);

  let skip = false;

  if (executedOperations.value.length < data.length) {
    skip = true;
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
  }

  if (!skip) {
    executedOperations.value = [];
    sourcesFromOperations.value = {};
  }

  const operationResults = new Map<
    string,
    { result: unknown; payload: PayloadWithOptions }
  >();

  const newPayloads: PayloadWithOptions[] = [];

  for (let i = 0; i < data.length; i++) {
    // Skip operations that have already been executed
    if (skip && i < executedOperations.value.length) {
      continue;
    }

    const { operation, payload } = data[i];

    if (!isOperation(operation)) {
      throw new Error('Invalid operation', { cause: operation });
    }

    const actionPayload: typeof payload = {
      ...adaptSources(payload, sourcesFromOperations.value),
      app: getAppProperties()
    };

    const result = await operation.action(actionPayload);

    const {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      app: _app,
      ...newPayload
    } = actionPayload;

    newPayloads[i] = newPayload;

    const sourceId =
      newPayload.options.sourceId || newPayload.options.newSourceId;

    if (sourceId && newPayload.options.targetType === 'dataframe') {
      operationResults.set(newPayload.options.newSourceId || sourceId, {
        result,
        payload: newPayload
      });
      const dfName = newPayload.target || newPayload.source;
      sourcesFromOperations.value[dfName] = result as Source;
    }
    console.info('Operation result:', { sourceId, result, newPayload });
  }

  operationItems.value = data.map((item, index) => ({
    ...item,
    payload: newPayloads[index] || item.payload
  }));

  const promisesResults = await Promise.allSettled(
    Array.from(operationResults.values()).map(({ result, payload }) =>
      handleDataframeResults(result, payload, changeTab)
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

const preparePayloadForSubmit = (
  payload: OperationPayload<PayloadWithOptions>
): OperationPayload<PayloadWithOptions> => {
  if (payload.options.saveToNewDataframe) {
    payload.options.newSourceId = getNewSourceId();
    if (!payload.target) {
      const dataframeNames = dataframes.value.map(df => df.df.name);
      payload.target = getUniqueName('df', dataframeNames);
    }
  }

  if (payload.options.usesInputDataframe) {
    const currentDataframeIndex = tabs.value[selectedTab.value]; // TODO should be the source of the operation
    const currentDataframe = dataframes.value[currentDataframeIndex];
    if (currentDataframe) {
      payload.source = currentDataframe?.df;
      payload.options.sourceId = currentDataframe?.sourceId;
    }
  }

  payload = fillColumns(payload, selection.value);

  return payload;
};

const preparePayloadOptions = (options: OperationOptions): OperationOptions => {
  const operationOptions: OperationOptions = Object.assign({}, options);

  if (
    operationOptions.usesInputCols &&
    operationOptions.usesOutputCols !== false
  ) {
    operationOptions.usesOutputCols = operationOptions.usesOutputCols || true;
  }

  return operationOptions;
};

const setOperationValues = (payload: OperationPayload<PayloadWithOptions>) => {
  operationValues.value = deepClone({
    ...payload,
    source: payload.source || dataframeObject.value?.df,
    app: {
      ...payload.app,
      settings: appSettings.value
    }
  });
};

const resetOperationValues = () => {
  operationValues.value = {};
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
    operation.defaultOptions,
    options
  );

  const payload = {
    options: operationOptions,
    ...operationPayload
  } as OperationPayload<PayloadWithOptions>;

  return { operation, payload: preparePayloadForSubmit(payload) };
};

const getOperationUsesPreview = (): boolean => {
  const { operation, payload } = getPreparedOperation();

  return Boolean(isOperation(operation) && payload?.options?.preview);
};

const operationActions: OperationActions = {
  submitOperation: async (changeTab = true) => {
    try {
      if (appStatus.value === 'ready') {
        appStatus.value = 'busy';
      }

      const { operation, payload } = getPreparedOperation();

      await blurr.value?.backendServer.donePromise;

      if (operation) {
        if (payload?.options.oneTime) {
          await operation.action({
            ...payload,
            options: {
              ...payload.options,
              preview: false
            },
            app: getAppProperties()
          });
          resetOperationValues();
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
          operationItems.value = [
            ...operationItems.value,
            ...inactiveOperationCells.value
          ];
          operationItems.value[editingIndex] = newOperation;
          inactiveOperationCells.value = [];
        } else {
          operationItems.value.push(newOperation);
        }
      }

      await executeOperations(changeTab);

      dataframeLayout.value?.clearChunks(true, false);

      resetOperationValues();
      state.value = 'operations';
      if (appStatus.value === 'busy') {
        appStatus.value = 'ready';
      }
    } catch (err) {
      addToast({
        title: 'Error executing operation',
        // error: err,
        type: 'error'
      });
      console.error('Error executing operation.', err);
      dataframeLayout.value?.clearChunks(true, false);
      if (appStatus.value === 'busy') {
        appStatus.value = 'ready';
      }
    }
    previewData.value = null;
    lastPayload = null;
  },
  cancelOperation: async (restoreInactive = false) => {
    console.info('Operation cancelled');
    previewOperationThrottled.cancel();
    dataframeLayout.value?.clearChunks(true, false);
    // const editing = operationValues.value.options?.editing;
    resetOperationValues();
    state.value = 'operations';
    if (operationItems.value.length === 0) {
      sidebar.value = null;
    }
    previewData.value = null;
    lastPayload = null;
    if (
      inactiveOperationCells.value.length > 0 &&
      restoreInactive /* && editing */
    ) {
      operationItems.value = [
        ...operationItems.value,
        ...inactiveOperationCells.value
      ];
      inactiveOperationCells.value = [];
      await new Promise(resolve => setTimeout(resolve, 0));
      await operationActions.submitOperation(false);
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
    sidebar.value = 'operations';

    // awaits to allow the sidebar to be rendered

    await new Promise(resolve => setTimeout(resolve, 0));

    if (operation?.defaultOptions) {
      setOperationValues({
        ...payload,
        options: preparePayloadOptions({
          ...operation.defaultOptions,
          ...(payload?.options || {})
        })
      } as OperationPayload<PayloadWithOptions>);
    } else {
      if (payload?.options) {
        payload.options = preparePayloadOptions(payload.options);
      }
      setOperationValues(payload as OperationPayload<PayloadWithOptions>);
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

    const allDataframes = dataframes.value.map(dataframe => {
      return {
        sourceId: dataframe.sourceId,
        name: dataframe.name,
        columns: Object.keys(dataframe.profile?.columns || {}),
        df: dataframe.df
      };
    });

    if (!operationValues.value) {
      operationValues.value = {};
    }

    operationValues.value.allDataframes = allDataframes;

    operationValues.value.otherDataframes = allDataframes.filter(
      (_, i) => i !== currentDataframeIndex
    );

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

const selectQualityOperation = (quality: 'match' | 'mismatch' | 'missing') => {
  operationActions.selectOperation(operations.filterRows, {
    conditions: [{ condition: quality }],
    action: quality === 'match' ? 'select' : 'drop',
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

const selectPatternOperation = (pattern: string, mode: number) => {
  operationActions.selectOperation(operations.filterRows, {
    conditions: [
      {
        condition: 'match_pattern',
        value: pattern,
        mode
      }
    ],
    action: 'select',
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

let lastPayload: OperationPayload<PayloadWithOptions> | null = null;

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

      const samePreview = compareObjects(lastPayload, payload, ['outputCols']);

      if (
        samePreview ||
        !operation ||
        !isOperation(operation) ||
        !payload?.options?.preview
      ) {
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
        operation.defaultOptions,
        payload.options
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
          ...payload,
          source: firstSampleSource,
          target: firstSampleSource.name,
          app: getAppProperties()
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
          options: {
            usesInputDataframe: true,
            usesDiff: payload.options.usesDiff
          },
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
          options: {
            usesInputDataframe: false,
            usesDiff: payload.options.usesDiff
          },
          type: payload.options.preview
        };

        // clear chunks

        dataframeLayout.value?.clearChunks(true, false);
        dataframeLayout.value?.setChunksLoading(false);
      }

      // get profile for preview columns

      checkPreviewCancel();

      const result = await operation.action({
        ...payload,
        source: payload.source,
        target: 'operation_preview_' + (payload.source?.name || 'load_df'),
        app: getAppProperties()
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
        !previewType.endsWith('no-profile') &&
        (previewColumnNames.length ||
          !usesInputDataframe ||
          previewType.startsWith('whole'))
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
          previewType.startsWith('whole') ||
          !payload.source ||
          !previewColumns.length
        ) {
          profile = await result.profile({
            cols: '*',
            bins: 33,
            requestOptions: { priority: PRIORITIES.previewProfile }
          });
        }

        if (!previewType.startsWith('whole') && previewColumns.length) {
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

      lastPayload = deepClone(payload);

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
        lastPayload = null;
        operationStatus.value = {
          message: err.message
            .split('\n')
            .filter(l => l)
            .pop(),
          fieldMessages: err instanceof FieldsError ? err.fieldMessages : {},
          status: 'error'
        };
      } else if (typeof err === 'string') {
        previewData.value = null;
        lastPayload = null;
        const message = (
          err
            .split('\n')
            .filter(l => l)
            .pop() || ''
        )
          .split('Exception: ')
          .pop();
        operationStatus.value = {
          message,
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

      await blurr.value?.backendServer.donePromise;

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

    if (selection?.values) {
      if (Array.isArray(selection.values) && selection.values.length) {
        selectValuesOperation(selection.values);
      } else if (!Array.isArray(selection.values) && selection.values) {
        selectQualityOperation(selection.values);
      }
    } else if (selection?.ranges?.length) {
      selectRangesOperation(selection.ranges);
    } else if (selection?.pattern) {
      selectPatternOperation(selection.pattern, selection.mode);
    } else if (isOperation(state.value)) {
      previewOperation();
    } else {
      state.value = {
        columns: selection?.columns || []
      };
      if (sidebar.value !== 'selection') {
        sidebar.value = 'selection';
      }
    }
  },
  { deep: true }
);

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

const emitWorkspaceData = () => {
  const dataframeCommands = operationItems.value.map(cell => {
    const { operation, payload } = cell;
    return {
      operationKey: operation.key,
      payload
    } as CommandData;
  });

  const dataframeTabs = tabs.value.map((tab, index) => {
    if (tab === -1) {
      return {
        selected: index === selectedTab.value
      } as TabData;
    }
    const dataframeObject: SomePartial<DataframeObject, 'df' | 'updates'> = {
      ...dataframes.value[tab]
    };
    const dfName = dataframeObject.df?.name;
    delete dataframeObject.df;
    return {
      ...dataframeObject,
      dfName,
      selected: index === selectedTab.value
    } as TabData;
  });

  emit('update:data', { commands: dataframeCommands, tabs: dataframeTabs });
};

const adaptSources = <T>(obj: T, sources: Record<string, Source>): T => {
  if (obj instanceof File) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(o => adaptSources(o, sources)) as T;
  }

  if (typeof obj === 'object' && obj !== null) {
    if ((obj as any)._blurrMember === 'source') {
      return sources[(obj as any).name] as T;
    }
    return objectMap(obj, o => adaptSources(o, sources)) as T;
  }

  return obj;
};

const initializeWorkspace = async () => {
  if (props.data !== null) {
    let { commands, tabs: tabsData } = props.data;

    commands = commands || [];
    tabsData = tabsData || [];

    operationItems.value = commands
      .map(command => {
        const operation = operations[command.operationKey];
        if (!operation) {
          return null;
        }
        return {
          operation,
          payload: command.payload
        } as OperationItem;
      })
      .filter((o): o is OperationItem => !!o);

    await executeOperations(false);

    const newTabs = [];
    let selectTab = -1;

    for (const tab of tabsData) {
      if (!tab.dfName) {
        newTabs.push(-1);
      } else {
        const index = tab.dfName
          ? dataframes.value.findIndex(df => df.df.name === tab.dfName)
          : dataframes.value.findIndex(df => df.sourceId === tab.sourceId);
        if (index >= 0) {
          newTabs.push(index);
        } else {
          console.warn('Tab with dfName or sourceId not found', tab);
          newTabs.push(-1);
        }
      }
      if (tab.selected) {
        selectTab = newTabs.length - 1;
      }
    }

    tabs.value = newTabs;

    if (selectTab >= 0) {
      selectedTab.value = selectTab;
    }
  }
  if (appStatus.value === 'loading') {
    appStatus.value = 'ready';
  }
};

watch(
  [tabs, selectedTab, operationItems],
  () => {
    emitWorkspaceData();
  },
  { deep: true }
);

const initializeEngine = async () => {
  try {
    const { Blurr } = blurrPackage;
    blurr.value = Blurr({
      serverOptions: {
        scriptURL: 'https://cdn.jsdelivr.net/pyodide/v0.22.1/full/pyodide.js',
        useWorker: true
      }
    });
    window.blurr = blurr.value;
    await blurr.value?.backendServer.donePromise;
    const result = await blurr.value?.runCode("'successfully loaded'");
    console.info('Initialization result:', result);
  } catch (err) {
    console.error('Error initializing blurr.', err);
    appStatus.value = 'error';
  }

  if (appStatus.value === 'loading' && !appSettings.value.workspaceMode) {
    appStatus.value = 'ready';
  }
};

provide('initializeEngine', initializeEngine);

const onKeyDown = (event: KeyboardEvent): void => {
  const key = event.key.toLowerCase();
  if (key === 'escape') {
    if (state.value === 'operations') {
      sidebar.value = null;
      dataframeLayout.value?.focusTable();
    } else if (state.value && sidebar.value) {
      operationActions.selectOperation(null);
      if (!operationItems.value.length && sidebar.value) {
        sidebar.value = null;
      }
    }
  }
};

onMounted(async () => {
  if (props.data !== null) {
    appSettings.value.workspaceMode = true;
  }
  document.addEventListener('keydown', onKeyDown);
  await initializeEngine();
  await initializeWorkspace();
});

onUnmounted(() => {
  document.removeEventListener('keydown', onKeyDown);
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
    'top toolbar'
    'table operations'
    'footer footer';
}

.hide-operations {
  grid-template-areas:
    'top toolbar'
    'table table'
    'footer footer';

  aside {
    display: none;
  }
}

.bumblebee-top-section {
  grid-area: top;
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
