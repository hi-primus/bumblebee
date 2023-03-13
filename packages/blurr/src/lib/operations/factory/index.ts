import type {
  ArgsType,
  Operation,
  OperationCreator,
} from '../../../types/operation';
import type { RunsCode, Server } from '../../../types/server';
import { isSource } from '../../client/data/source';
import {
  adaptKwargs,
  camelToSnake,
  generateUniqueVariableName,
  isName,
  isObject,
  Name,
  objectMap,
  optionalPromise,
  pythonArguments,
} from '../../utils';

const initialized: string[] = [];

export function makePythonCompatible(
  server: RunsCode,
  value: OperationCompatible,
  useProxies = false
) {
  if (useProxies && (server as Server)?.pyodide?.isPyProxy(value)) {
    return value;
  } else if (useProxies && isSource(value)) {
    return value.data || server.getGlobal(value.toString());
  } else if (isSource(value) || isName(value)) {
    return Name(value.name || value.toString());
  } else if (value instanceof ArrayBuffer) {
    if (!server.supports('buffers')) {
      console.warn('Files not supported on this kind of server');
      return null;
    }
    if (useProxies) {
      return value;
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
    if (useProxies) {
      return value;
    }
    const name = generateUniqueVariableName('func');
    server.setGlobal(name, value);
    return Name(name);
  } else if (Array.isArray(value)) {
    return value.map((v: OperationCompatible) =>
      makePythonCompatible(server, v, useProxies)
    );
  } else if (isObject(value)) {
    return objectMap(value, (v: OperationCompatible) =>
      makePythonCompatible(server, v, useProxies)
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

function getRunMethod(
  operation: Operation,
  operationCreator: OperationCreator
) {
  if (operationCreator.getCode) {
    return (server: Server, kwargs) => {
      server.options.local && delete kwargs.target;
      const requestOptions = kwargs.requestOptions;
      delete kwargs.requestOptions;
      const code = operationCreator.getCode(kwargs);
      console.log('[CODE FROM GENERATOR]', code, {
        kwargs,
        args: operation.args,
      });
      return server.runCode(
        code,
        requestOptions
      ) as PromiseOr<PythonCompatible>;
    };
  } else if (operationCreator.run) {
    return (server: Server, kwargs) => {
      server.options.local && delete kwargs.target;
      console.log('[ARGUMENTS]', kwargs);
      return operationCreator.run(server, kwargs);
    };
  } else {
    return (server: Server, kwargs) => {
      if (server.options.local) {
        let source = kwargs.source || operationCreator.defaultSource;

        const path = camelToSnake(operationCreator.name).split('.');

        if (!source && path.length > 1) {
          source = path[0];
          path.shift();
        }

        const requestOptions = kwargs.requestOptions;
        delete kwargs.requestOptions;

        return server.runMethod(
          source,
          path.join('.'),
          kwargs,
          requestOptions
        ) as PromiseOr<PythonCompatible>;
      } else {
        const source = kwargs.source || operationCreator.defaultSource;
        const target = server.options.local ? null : kwargs.target;
        const requestOptions = kwargs.requestOptions;
        delete kwargs.requestOptions;
        const code =
          (target ? `${target} = ` : '') +
          (source ? `${source.toString()}.` : '') +
          camelToSnake(operationCreator.name) +
          `(${pythonArguments(kwargs)})`;
        console.log('[CODE FROM DEFAULT GENERATOR]', code);
        return server.runCode(
          code,
          requestOptions
        ) as PromiseOr<PythonCompatible>;
      }
    };
  }
}

export function BlurrOperation<
  TA extends ArgsType = ArgsType,
  TR extends OperationCompatible = OperationCompatible
>(operationCreator: OperationCreator) {
  const operation = { ...operationCreator } as Operation<TA, TR>;

  operation._blurrMember = 'operation';

  operation.args = (operationCreator.args || []).map((arg) => {
    return typeof arg === 'string' ? { name: arg } : arg;
  });

  operation._run = getRunMethod(operation, operationCreator);

  if (operationCreator.getInitializationCode) {
    operation.initialize = (server: RunsCode) => {
      return server.runCode(
        operationCreator.getInitializationCode()
      ) as PromiseOr<PythonCompatible>;
    };
  } else if (operationCreator.initialize) {
    operation.initialize = operationCreator.initialize;
  }

  operation.run = function (server: Server, args: TA): PromiseOr<TR> {
    if (!isKwargs(args)) {
      throw new Error(`Invalid kwargs, received arg of type '${typeof args}'`);
    }

    const initialization =
      operation.initialize &&
      !initialized.includes(operation.name) &&
      operation.initialize(server);

    const initializationResult = optionalPromise(initialization, () => {
      initialized.push(operation.name);
      return operation.name;
    });

    const operationArgs = operation.args || [];
    const kwargs = adaptKwargs(args, operationArgs);

    const operationResult = optionalPromise(initializationResult, () => {
      return operation._run(
        server,
        makePythonCompatible(server, kwargs, server.options.local)
      );
    });

    return optionalPromise(operationResult, (operationResult) => {
      if (server.options.local && server.pyodide.isPyProxy(operationResult)) {
        return operationResult as unknown as TR; // TODO: Check support for proxies in types
      }

      if (operation.targetType == 'dataframe') {
        return Name(kwargs.target.toString());
      }
      return operationResult;
    }) as PromiseOr<TR>;
  };

  return operation;
}
