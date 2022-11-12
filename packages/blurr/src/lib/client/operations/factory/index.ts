import { Operation, OperationCreator } from '../../../../types/operation';
import { RunsCode } from '../../../../types/server';
import {
  generateUniqueVariableName,
  isObject,
  objectMap,
  pythonArguments,
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

function isKwargs(
  kwargs: unknown
): kwargs is Record<string, OperationCompatible> {
  return (
    kwargs &&
    typeof kwargs === 'object' &&
    Object.keys(kwargs).every((key) => typeof key === 'string')
  );
}

async function callOperation<
  TA = OperationArgs<OperationCompatible>,
  TR = OperationCompatible
>(
  client: RunsCode,
  operation: Operation<TA, TR> = null,
  kwargs: Record<string, OperationCompatible> = {}
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
    makePythonCompatible(client, kwargs)
  );
  if (operation.targetType == 'dataframe') {
    return BlurrSource(client, kwargs.target.toString());
  }
  return operationResult;
}

export function BlurrOperation<
  TA = OperationArgs<OperationCompatible>,
  TR = OperationCompatible
>(operationCreator: OperationCreator): Operation<TA, TR> {
  let _run: (client: RunsCode, kwargs) => Promise<PythonCompatible>;
  if (operationCreator.getCode) {
    _run = async (client: RunsCode, kwargs) => {
      return await client.run(operationCreator.getCode(kwargs));
    };
  } else if (operationCreator.run) {
    _run = operationCreator.run;
  } else {
    _run = async (client: RunsCode, kwargs) => {
      let source = kwargs.source || operationCreator.defaultSource;
      if (source) {
        source = `${source}.`;
      }
      return await client.run(
        `${source}${operationCreator.name}(${pythonArguments(kwargs)})`
      );
    };
  }
  let initialize: (client: RunsCode) => Promise<PythonCompatible>;
  if (operationCreator.getInitializationCode) {
    initialize = async (client: RunsCode) => {
      return await client.run(operationCreator.getInitializationCode());
    };
  } else if (operationCreator.initialize) {
    initialize = operationCreator.initialize;
  }

  const operation: Operation<TA, TR> = {
    name: operationCreator.name,
    sourceType: operationCreator.sourceType,
    targetType: operationCreator.targetType,
    initialize,
    _run,
    run: async function (client, kwargs: TA): Promise<TR> {
      if (isKwargs(kwargs)) {
        const result = (await callOperation(client, operation, kwargs)) as TR;
        return result;
      }
      console.error(kwargs);
      throw new Error('kwargs must be an object with string keys');
    },
    _blurrMember: 'operation',
  };

  return operation;
}
