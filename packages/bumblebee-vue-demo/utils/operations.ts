import { Client, Source } from 'blurr/build/main/types';

import {
  Operation,
  OperationCreator,
  OperationOptions
} from '@/types/operations';

type Cols = string[];

const createOperation = <TA extends Record<string, unknown>, TR>(
  operationCreator: OperationCreator<TA, TR>
): Operation<TA, TR> => {
  const operation = { ...operationCreator } as Operation<TA, TR>;
  operation.fields = [...(operationCreator.fields || [])];
  operation.defaultOptions = Object.assign(
    {},
    operationCreator.defaultOptions || {},
    { targetType: 'dataframe' }
  );
  operation.action = (payload: TA) => {
    const options: Partial<OperationOptions> = Object.assign(
      {},
      operation.defaultOptions,
      payload._options as OperationOptions
    );
    if (options.usesInputDataframe && !payload.source) {
      throw new Error('Input dataframe is required');
    }
    if (options.usesInputCols && !payload.cols) {
      throw new Error('Input columns are required');
    }
    if (options.usesOutputCols && !payload.outputCols) {
      if (options.usesInputCols && payload.cols) {
        payload = {
          ...payload,
          outputCols: payload.cols
        };
      } else {
        throw new Error('Output columns are required');
      }
    }

    return operationCreator.action(payload);
  };
  return operation;
};

export const operations = [
  createOperation({
    key: 'loadFromUrl',
    name: 'Load from url',
    defaultOptions: {
      saveToNewDataframe: true
    },
    action: (payload: { blurr: Client; url: string }): Source => {
      return payload.blurr.readCsv(payload.url);
    },
    fields: [
      {
        name: 'url',
        label: 'Url',
        type: 'string'
      }
    ],
    shortcut: 'ff'
  }),
  createOperation({
    key: 'unnestColumns',
    name: 'Unnest columns',
    alias: 'Split cols',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      separator: string;
    }): Source => {
      return payload.source.cols.unnest({
        cols: payload.cols,
        separator: payload.separator
      });
    },
    fields: [
      {
        name: 'separator',
        label: 'Separator',
        type: 'string'
      }
    ],
    shortcut: 'cu'
  }),
  createOperation({
    key: 'nestColumns',
    name: 'Nest columns',
    alias: 'Unsplit cols',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: true
    },
    action: (payload: {
      options: OperationOptions;
      source: Source;
      cols: Cols;
      separator: string;
    }): Source => {
      if (payload.options.preview) {
        if (payload.cols.length <= 1) {
          throw new Error('[PREVIEW] At least two columns are required', {
            cause: payload.cols
          });
        }
      }
      const drop = !payload.options.preview;
      return payload.source.cols.nest({
        cols: payload.cols,
        separator: payload.separator,
        drop
      });
    },
    fields: [
      {
        name: 'separator',
        label: 'Separator',
        type: 'string'
      }
    ],
    shortcut: 'cn'
  })
];
