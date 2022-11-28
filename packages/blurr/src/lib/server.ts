import fetch from 'cross-fetch';
import * as pyodidePackage from 'pyodide';

import type { LoadPyodideType, PyodideBackendOptions } from '../types/pyodide';
import type { Server as ServerInterface } from '../types/server';
import type { ServerOptions } from '../types/server';

import { getOperation } from './operations';
import { makePythonCompatible } from './operations/factory';
import { isPromiseLike, loadScript } from './utils';

const defaultPyodideOptions: PyodideBackendOptions = {
  scriptURL: 'https://cdn.jsdelivr.net/pyodide/v0.21.3/full/pyodide.js',
  local: true,
};

async function loadPyodide(options: PyodideBackendOptions) {
  if (globalThis.loadedPyodide) {
    console.log('Pyodide was already loaded');
    return globalThis.loadedPyodide;
  }

  globalThis.fetch = globalThis?.fetch || fetch;

  if (options?.scriptURL) {
    console.log('Loading pyodide from script', options.scriptURL);
    await loadScript(options.scriptURL);
  }

  delete options.scriptURL;

  if (!globalThis?.loadPyodide) {
    console.warn(
      'loadPyodide function not found in globalThis, this may break'
    );
  }

  const _loadPyodide: LoadPyodideType =
    globalThis?.loadPyodide || pyodidePackage?.loadPyodide;

  const pyodide = await _loadPyodide(options);

  globalThis.loadedPyodide = pyodide;

  return pyodide;
}

function _mapToObject(map: Map<string, unknown>): Record<string, unknown> {
  const obj = {};
  for (const [key, value] of map) {
    obj[key] = value;
  }
  return obj;
}

function ServerPyodide(options: ServerOptions): ServerInterface {
  const server = {} as ServerInterface & { _features: string[] };

  server.options = Object.assign({}, defaultPyodideOptions, options);

  const pyodidePromise = loadPyodide(
    server.options as PyodideBackendOptions
  ).then(async (pyodide) => {
    await pyodide.loadPackage('micropip');
    const micropip = pyodide.pyimport('micropip');

    await micropip.install(
      'https://test-files.pythonhosted.org/packages/4b/41/a3e8331bd09ffcca4834715b4c269fc2cfa5acdfa4fb080f02a3c0acf688/pyoptimus-0.1.40212-py3-none-any.whl'
    );
    pyodide.runPython(`
      from optimus import Optimus
      from io import BytesIO
      op = Optimus("pyscript")
      def run_method(method, kwargs):
          return method(**kwargs.to_py())
    `);
    return pyodide;
  });

  server.pyodide = null;

  server.backend = null;

  server.backendLoaded = false;

  server.donePromise = pyodidePromise.then((pyodide) => {
    server.pyodide = server.backend = pyodide;
    server.backendLoaded = true;
    return true;
  });

  function _optionalPromise(callback) {
    if (typeof callback === 'function') {
      type CallbackType = typeof callback;
      return function (
        ...args: Parameters<CallbackType>
      ): ReturnType<CallbackType> {
        if (server.backendLoaded) {
          return callback(...args);
        }
        return server.donePromise.then(() =>
          callback(...args)
        ) as ReturnType<CallbackType>;
      };
    }
    return callback;
  }

  server.runCode = _optionalPromise((code: string) => {
    const result = server.backend.runPython(code);
    try {
      return typeof result?.toJs === 'function'
        ? result.toJs({ dict_converter: _mapToObject })
        : result;
    } catch (error) {
      console.warn('Error converting to JS', code, error);
      return result;
    }
  });

  server.run = (paramsArray: ArrayOrSingle<Params>) => {
    if (!Array.isArray(paramsArray)) {
      paramsArray = [paramsArray];
    }

    const operations = paramsArray.map((params) => {
      const { operationKey, operationType, ...kwargs } = params;
      const operation = getOperation(operationKey, operationType);
      if (!operation) {
        throw new Error(
          `Operation '${operationKey}' of type '${operationType}' not found`
        );
      }
      return { operation, kwargs };
    });

    return operations.reduce((promise: Promise<PythonCompatible>, _, i) => {
      const { operation, kwargs } = operations[i];

      const _operation = (result) => {
        if (
          i > 0 &&
          !kwargs.source &&
          operation.sourceType === 'dataframe' &&
          operations[i - 1].operation.targetType === 'dataframe' &&
          result !== undefined
        ) {
          kwargs.source = makePythonCompatible(
            server,
            result,
            server.options.local
          );
        }

        return operation.run(server, kwargs);
      };

      // check if `promise` is a promise
      if (isPromiseLike(promise)) {
        return promise.then(_operation) as Promise<PythonCompatible>;
      }

      return _operation(promise) as Promise<PythonCompatible>;
    }, undefined) as PromiseOr<PythonCompatible>;
  };

  server.runMethod = _optionalPromise((method, kwargs) => {
    const runMethodProxy = server.pyodide.globals.get('run_method');
    const result = runMethodProxy(method, kwargs);
    try {
      return typeof result?.toJs === 'function'
        ? result.toJs({ dict_converter: _mapToObject })
        : result;
    } catch (error) {
      console.warn('Error converting to JS', error);
      return result;
    }
  });

  server._features = ['buffers', 'callbacks'];

  server.supports = (features: string | Array<string>) => {
    if (typeof features === 'string') {
      features = [features];
    }
    return features.every((feature) => server._features.includes(feature));
  };

  server.setGlobal = _optionalPromise((name: string, value: unknown) => {
    server.pyodide.globals.set(name, value);
  });

  server.getGlobal = _optionalPromise((name: string) => {
    return server.pyodide.globals.get(name);
  });

  return server;
}

/**
 * Initializes a Server instance
 * ### Example (es module)
 * ```js
 * import { Server } from 'blurr'
 * const server = Server({ backend: 'pyodide' });
 * const pyodide = await server.donePromise;
 * // TODO: Update docstring
 * ```
 *
 * @param options - options to initialize, passed to loadPyodide, etc...
 * @param options.backend - "pyodide", "kernel-gateway"
 * @param options.scriptURL - (Pyodide on front-end) Replaces the installed version of pyodide
 */

export const defaultOptions: ServerOptions = { backend: 'pyodide' };

export function Server(
  options: ServerOptions = defaultOptions
): ServerInterface {
  options = Object.assign({}, defaultOptions, options);
  if (options.backend === 'pyodide') {
    delete options.backend;
    return ServerPyodide(options);
  }

  throw new Error('Cannot initialize a server without a backend');
}
