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
    if (options.usesInputDataframe && !payload.df) {
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

export const operations = {
  loadFromUrl: createOperation({
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
  unnestColumns: createOperation({
    name: 'Unnest columns',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true
    },
    action: (payload: {
      df: Source;
      cols: Cols;
      separator: string;
    }): Source => {
      return payload.df.cols.unnest({
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
  nestColumns: createOperation({
    name: 'Nest columns',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true
    },
    action: (payload: {
      df: Source;
      cols: Cols;
      separator: string;
    }): Source => {
      return payload.df.cols.nest({
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
    shortcut: 'cn'
  })
};
