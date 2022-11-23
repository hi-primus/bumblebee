import {
  ArgsType,
  Operation,
  OperationCreator,
} from '../../../types/operation';
import { RunsCode } from '../../../types/server';
import { isSource } from '../../client/data/source';
import {
  adaptKwargs,
  camelToSnake,
  generateUniqueVariableName,
  isName,
  isObject,
  Name,
  objectMap,
  pythonArguments,
} from '../../utils';

const initialized: string[] = [];

export function makePythonCompatible(
  server: RunsCode,
  value: OperationCompatible
) {
  if (isSource(value) || isName(value)) {
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
): Promise<PythonCompatible> {
  await client.donePromise;

  if (operation.initialize && !initialized.includes(operation.name)) {
    initialized.push(operation.name);
    operation.initialize(client);
  }

  const operationArgs = operation.args || [];

  const kwargs = adaptKwargs(args, operationArgs);

  const operationResult = await operation._run(
    client,
    makePythonCompatible(client, kwargs)
  );
  if (operation.targetType == 'dataframe') {
    return Name(kwargs.target.toString());
  }
  return operationResult;
}

export function BlurrOperation<
  TA extends ArgsType = ArgsType,
  TR extends OperationCompatible = OperationCompatible
>(operationCreator: OperationCreator) {
  const operation = {} as Operation<TA, TR>;

  operation.name = operationCreator.name;
  operation.sourceType = operationCreator.sourceType;
  operation.targetType = operationCreator.targetType;
  operation._blurrMember = 'operation';

  operation.args = (operationCreator.args || []).map((arg) => {
    return typeof arg === 'string' ? { name: arg } : arg;
  });

  if (operationCreator.getCode) {
    operation._run = async (server, kwargs) => {
      const code = operationCreator.getCode(kwargs);
      console.log('[CODE FROM GENERATOR]', code, {
        kwargs,
        args: operation.args,
      });
      return await server.runCode(code);
    };
  } else if (operationCreator.run) {
    operation._run = async (server, kwargs) => {
      console.log('[ARGUMENTS]', kwargs);
      return operationCreator.run(server, kwargs);
    };
  } else {
    operation._run = async (server, kwargs) => {
      const source = kwargs.source || operationCreator.defaultSource;
      console.log('source', source);
      const code =
        (kwargs.target ? `${kwargs.target} = ` : '') +
        (source ? `${source.toString()}.` : '') +
        camelToSnake(operationCreator.name) +
        `(${pythonArguments(kwargs)})`;
      console.log('[CODE FROM DEFAULT GENERATOR]', code);
      return await server.runCode(code);
    };
  }

  if (operationCreator.getInitializationCode) {
    operation.initialize = async (server: RunsCode) => {
      return await server.runCode(operationCreator.getInitializationCode());
    };
  } else if (operationCreator.initialize) {
    operation.initialize = operationCreator.initialize;
  }

  operation.run = async function (server, kwargs: TA): Promise<TR> {
    if (isKwargs(kwargs)) {
      return callOperation(server, operation, kwargs) as Promise<TR>;
    }
    throw new Error(
      `kwargs must be an object with string keys, type received: ${typeof kwargs}`
    );
  };

  return operation;
}
