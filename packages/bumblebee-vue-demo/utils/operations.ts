import { Client, Source } from 'blurr/build/main/types';

import { Operation, OperationCreator } from '@/types/operations';

const createOperation = <TA, TR>(
  operationCreator: OperationCreator<TA, TR>
): Operation<TA, TR> => {
  const operation = { ...operationCreator } as Operation<TA, TR>;
  operation.fields = [...(operationCreator.fields || [])];
  operation.defaultOptions = operationCreator.defaultOptions || {
    targetType: 'value'
  };
  return operation;
};

export const operations = {
  loadFromUrl: createOperation({
    name: 'Load from url',
    defaultOptions: { targetType: 'dataframe', saveToNewDataframe: true },
    action: (payload: { blurr: Client; url: string }): Source => {
      return payload.blurr.readCsv(payload.url);
    },
    fields: [
      {
        name: 'url',
        label: 'Url',
        type: 'string'
      }
    ]
  }),
  unnestColumns: createOperation({
    name: 'Unnest columns',
    action: ({ df }: { df: Source }): Source => {
      return df.cols.unnest();
    }
  })
};
