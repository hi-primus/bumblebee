import { Operation, OperationCreator } from '../../../../types/operation';
import { RunsCode } from '../../../../types/server';
import {
  generateUniqueVariableName,
  isObject,
  objectMap,
} from '../../../utils';

import { BlurrSource, isSource } from './../../data/source';

const initialized: string[] = [];

function makePythonCompatible(client: RunsCode, value: OperationCompatible) {
  if (isSource(value)) {
    return value.toString();
  } else if (value instanceof ArrayBuffer) {
    if (!client.supports('files')) {
      console.warn('Files not supported on this kind of server');
      return null;
    }
    const name = generateUniqueVariableName('file');
    client.setGlobal(name, value);
    return name;
  } else if (Array.isArray(value)) {
    return value.map((v: OperationCompatible) =>
      makePythonCompatible(client, v)
    );
  } else if (isObject(value)) {
    return objectMap(value, (v: OperationCompatible) =>
      makePythonCompatible(client, v)
    );
  } else {
    return value;
  }
}

async function callOperation<T = OperationCompatible>(
  client: RunsCode,
  operation: Operation<T> = null,
  kwargs: Record<string, OperationCompatible> = {},
  args: Array<OperationCompatible> = []
): Promise<OperationCompatible> {
  await client.donePromise;

  if (operation.initialize && !initialized.includes(operation.name)) {
    initialized.push(operation.name);
    operation.initialize(client);
  }

  if (!kwargs.target && operation.targetType === 'dataframe') {
    if (operation.targetType === operation.sourceType) {
      kwargs.target = kwargs.source;
    } else {
      kwargs.target = generateUniqueVariableName(operation.targetType);
    }
  }

  const operationResult = await operation._run(
    client,
    makePythonCompatible(client, kwargs),
    makePythonCompatible(client, args)
  );
  if (operation.targetType == 'dataframe') {
    return BlurrSource(client, kwargs.target.toString());
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
