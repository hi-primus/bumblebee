import { Client, Source } from 'blurr/build/main/types';

import { Operation, OperationCreator } from '@/types/operations';

const createOperation = <TA, TR>(
  operationCreator: OperationCreator<TA, TR>
): Operation<TA, TR> => {
  const operation = { ...operationCreator } as Operation<TA, TR>;
  operation.fields = [...(operationCreator.fields || [])];
  operation.targetType = operationCreator.targetType || 'value';
  return operation;
};

export const operations = {
  loadFromUrl: createOperation({
    name: 'Load from url',
    action: (payload: { client: Client; url: string }): Source => {
      return payload.client.readCsv(payload.url);
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
