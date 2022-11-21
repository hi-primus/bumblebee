import fetch from 'cross-fetch';
import * as pyodidePackage from 'pyodide';

import { LoadPyodideType, PyodideBackendOptions } from '../types/pyodide';
import { Server } from '../types/server';
import { BackendOptions } from '../types/server';

import { getOperation } from './operations';
import { loadScript, Name } from './utils';

const defaultPyodideOptions: PyodideBackendOptions = {
  scriptURL: 'https://cdn.jsdelivr.net/pyodide/v0.21.3/full/pyodide.js',
};

async function loadPyodide(options: PyodideBackendOptions) {
  if (globalThis.loadedPyodide) {
    console.log('Pyodide was already loaded');
    return globalThis.loadedPyodide;
  }

  globalThis.fetch = globalThis?.fetch || fetch;

  options = Object.assign({ ...defaultPyodideOptions }, options);

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

function BlurrServerPyodide(options: PyodideBackendOptions): Server {
  const pyodidePromise = loadPyodide(options).then(async (pyodide) => {
    await pyodide.loadPackage('micropip');
    const micropip = pyodide.pyimport('micropip');

    await micropip.install(
      'https://test-files.pythonhosted.org/packages/4b/41/a3e8331bd09ffcca4834715b4c269fc2cfa5acdfa4fb080f02a3c0acf688/pyoptimus-0.1.40212-py3-none-any.whl'
    );
    pyodide.runPythonAsync(`
      from optimus import Optimus
      from io import BytesIO
      op = Optimus("pyscript")
    `);
    return pyodide;
  });

  const server = {
    pyodide: null,
    backend: null,
    backendLoaded: false,
    donePromise: pyodidePromise.then((pyodide) => {
      server.pyodide = server.backend = pyodide;
      server.backendLoaded = true;
      return true;
    }),
    runCode: async (code: string) => {
      await server.donePromise;
      const result = await server.backend.runPythonAsync(code);
      try {
        return typeof result?.toJs === 'function'
          ? result.toJs({ dict_converter: _mapToObject })
          : result;
      } catch (error) {
        console.warn('Error converting to JS', code, error);
        return result;
      }
    },
    run: async (paramsArray: ArrayOrSingle<Params>) => {
      if (!Array.isArray(paramsArray)) {
        paramsArray = [paramsArray];
      }
      let result: PythonCompatible = undefined;
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
      for (let i = 0; i < operations.length; i++) {
        const { operation, kwargs } = operations[i];

        if (
          i > 0 &&
          operation.sourceType === 'dataframe' &&
          operations[i - 1].operation.targetType === 'dataframe' &&
          result !== undefined
        ) {
          kwargs.source = Name(result.toString());
        }

        // the client handles the type correctly, in server-side, just use PythonCompatible
        result = (await operation.run(server, kwargs)) as PythonCompatible;
      }
      return result;
    },
    _features: ['buffers', 'callbacks'],
    supports: (features: string | Array<string>) => {
      if (typeof features === 'string') {
        features = [features];
      }
      return features.every((feature) => server._features.includes(feature));
    },
    setGlobal: async (name: string, value: unknown) => {
      await server.donePromise;
      server.pyodide.globals.set(name, value);
    },
  };

  return server;
}

/**
 * Initializes a BlurrServer instance
 * ### Example (es module)
 * ```js
 * import { BlurrServer } from 'blurr'
 * const server = BlurrServer({ backend: 'pyodide' });
 * const pyodide = await server.donePromise;
 * // TODO: Update docstring
 * ```
 *
 * @param options - options to initialize, passed to loadPyodide, etc...
 * @param options.backend - "pyodide", "kernel-gateway"
 * @param options.scriptURL - (Pyodide on front-end) Replaces the installed version of pyodide
 */

const defaultOptions = { backend: 'pyodide' };

export function BlurrServer(options: BackendOptions = defaultOptions): Server {
  options = Object.assign({ ...defaultOptions }, options);
  if (options.backend === 'pyodide') {
    delete options.backend;
    return BlurrServerPyodide(options);
  }

  throw new Error('Cannot initialize a server without a backend');
}
