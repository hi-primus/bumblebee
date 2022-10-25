import { generateUniqueVariableName } from '../../../utils';

import { removeSource, Source } from './../../data/source';

async function callOperation<T = OperationCompatible>(
  client: RunsCode,
  operation: Operation<T> = null,
  kwargs: Record<string, OperationCompatible> = {},
  args: Array<OperationCompatible> = []
): Promise<OperationCompatible> {
  await client.donePromise;

  if (operation.initialize) {
    operation.initialize(client); // TODO: execute once
  }

  if (!kwargs.target) {
    if (operation.targetType === operation.sourceType) {
      kwargs.target = kwargs.source;
    } else {
      kwargs.target = generateUniqueVariableName(operation.targetType);
    }
  }

  const operationResult = await operation._run(
    client,
    removeSource(kwargs),
    removeSource(args)
  );
  if (operation.targetType == 'dataframe') {
    return Source(kwargs.target.toString(), client);
  }
  return operationResult;
}

export function BlurrOperation<T = OperationCompatible>(
  operationCreator: OperationCreator
): Operation<T> {
  let _run: (client: RunsCode, kwargs, args) => Promise<PythonCompatible>;
  if (operationCreator.getCode) {
    _run = async (client: RunsCode, kwargs, args) => {
      return await client.run(operationCreator.getCode(kwargs, args));
    };
  } else if (operationCreator.run) {
    _run = operationCreator.run;
  }
  let initialize: (client: RunsCode) => Promise<PythonCompatible>;
  if (operationCreator.getInitializationCode) {
    initialize = async (client: RunsCode) => {
      return await client.run(operationCreator.getInitializationCode());
    };
  } else if (operationCreator.initialize) {
    initialize = operationCreator.initialize;
  }

  const operation: Operation<T> = {
    name: operationCreator.name,
    sourceType: operationCreator.sourceType,
    targetType: operationCreator.targetType,
    initialize,
    _run,
    run: async function (client, kwargs, args): Promise<T> {
      const result = (await callOperation(
        client,
        operation,
        kwargs,
        args
      )) as T;
      return result;
    },
    _blurrMember: 'operation',
  };

  return {
    ...operation,
    run: async function (client, kwargs, args): Promise<T> {
      const result = (await callOperation(
        client,
        operation,
        kwargs,
        args
      )) as T;
      return result;
    },
  };
}
