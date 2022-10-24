import { generateUniqueVariableName } from '../../utils';

import { removeSource, Source } from './../data/source';
import { operations as dataframeOperations } from './dataframe';

export const operations = {
  ...dataframeOperations,
};

const operationsByType = {
  dataframe: dataframeOperations,
};

export function getOperation(
  sourceType?: keyof typeof operationsByType,
  name?: string
): Operation {
  const _operations = !sourceType ? operations : operationsByType[sourceType];
  if (name in _operations) {
    return _operations[name];
  }
  return null;
}

export async function callOperation(
  client: Client,
  operation: Operation = null,
  kwargs: Record<string, OperationCompatible> = {},
  args: Array<OperationCompatible> = []
): Promise<OperationCompatible> {
  await client.backendServer.backendPromise;

  if (operation.initialization) {
    operation.initialization(client.backendServer); // TODO: execute once
  }

  if (!kwargs.target) {
    if (operation.targetType === operation.sourceType) {
      kwargs.target = kwargs.source;
    } else {
      kwargs.target = generateUniqueVariableName(operation.targetType);
    }
  }

  const operationResult = await operation.callback(
    client.backendServer,
    removeSource(kwargs),
    removeSource(args)
  );
  if (operation.targetType == 'dataframe') {
    return Source(kwargs.target.toString(), client);
  }
  return operationResult;
}
