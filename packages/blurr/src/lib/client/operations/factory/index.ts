import {
  ArgsType,
  Operation,
  OperationArgument,
  OperationCreator,
} from '../../../../types/operation';
import { RunsCode } from '../../../../types/server';
import {
  adaptKwargs,
  camelToSnake,
  generateUniqueVariableName,
  isObject,
  isStringArray,
  Name,
  objectMap,
  pythonArguments,
} from '../../../utils';

import { BlurrSource, isSource } from './../../data/source';

const initialized: string[] = [];

function makePythonCompatible(server: RunsCode, value: OperationCompatible) {
  if (isSource(value)) {
    return Name(value.toString());
  } else if (value instanceof ArrayBuffer) {
    if (!server.supports('buffers')) {
      console.warn('Files not supported on this kind of server');
      return null;
    }
    const name = generateUniqueVariableName('file');
    server.setGlobal(name, value);
    return Name(name);
  } else if (value instanceof Function) {
    if (!server.supports('callbacks')) {
      console.warn(
        'Callbacks not supported as parameters on this kind of server'
      );
      return null;
    }
    const name = generateUniqueVariableName('func');
    server.setGlobal(name, value);
    return Name(name);
  } else if (Array.isArray(value)) {
    return value.map((v: OperationCompatible) =>
      makePythonCompatible(server, v)
    );
  } else if (isObject(value)) {
    return objectMap(value, (v: OperationCompatible) =>
      makePythonCompatible(server, v)
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
  TA extends OperationArgs<OperationCompatible> = OperationArgs<OperationCompatible>,
  TR extends OperationCompatible = OperationCompatible
>(
  client: RunsCode,
  operation: Operation<TA, TR> = null,
  args: InputArgs = {}
): Promise<OperationCompatible> {
  await client.donePromise;

  if (operation.initialize && !initialized.includes(operation.name)) {
    initialized.push(operation.name);
    operation.initialize(client);
  }

  const operationArgs = operation.args || [];

  const kwargs = adaptKwargs(args, operationArgs);

  if (!('target' in kwargs) && operation.targetType === 'dataframe') {
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
  TA extends ArgsType = ArgsType,
  TR extends OperationCompatible = OperationCompatible
>(operationCreator: OperationCreator) {
  let _run: (
    client: RunsCode,
    kwargs: Record<string, PythonCompatible>
  ) => Promise<PythonCompatible>;

  if (operationCreator.getCode) {
    _run = async (server, kwargs) => {
      const code = operationCreator.getCode(kwargs);
      console.log('[CODE FROM GENERATOR]', code, { kwargs, operationArgs });
      return await server.run(code);
    };
  } else if (operationCreator.run) {
    _run = async (server, kwargs) => {
      console.log('[ARGUMENTS]', kwargs);
      return operationCreator.run(server, kwargs);
    };
  } else {
    _run = async (server, kwargs) => {
      const source = kwargs.source || operationCreator.defaultSource;
      const code =
        (kwargs.target ? `${kwargs.target} = ` : '') +
        (source ? `${source}.` : '') +
        camelToSnake(operationCreator.name) +
        `(${pythonArguments(kwargs)})`;
      console.log('[CODE FROM DEFAULT GENERATOR]', code);
      return await server.run(code);
    };
  }
  let initialize: (server: RunsCode) => Promise<PythonCompatible>;
  if (operationCreator.getInitializationCode) {
    initialize = async (server: RunsCode) => {
      return await server.run(operationCreator.getInitializationCode());
    };
  } else if (operationCreator.initialize) {
    initialize = operationCreator.initialize;
  }

  const _operationArgs = operationCreator.args;

  let operationArgs: OperationArgument[];

  if (isObject(_operationArgs)) {
    operationArgs = Object.keys(_operationArgs).map((key) => ({
      name: key,
      default: _operationArgs[key],
    }));
  } else if (isStringArray(_operationArgs)) {
    operationArgs = _operationArgs.map((name) => ({ name }));
  } else {
    operationArgs = _operationArgs;
  }

  const operation: Operation<TA, TR> = {
    name: operationCreator.name,
    sourceType: operationCreator.sourceType,
    targetType: operationCreator.targetType,
    args: operationArgs,
    initialize,
    _run,
    run: async function (client, kwargs: TA): Promise<TR> {
      if (isKwargs(kwargs)) {
        const result = (await callOperation(client, operation, kwargs)) as TR;
        return result;
      }
      throw new Error(
        `kwargs must be an object with string keys, type received: ${typeof kwargs}`
      );
    },
    _blurrMember: 'operation',
  };

  return operation;
}
