import type { PyodideBackendOptions } from '../../types/pyodide';
import type { Server as ServerInterface } from '../../types/server';
import type { ServerOptions } from '../../types/server';
import type { Source as SourceInterface } from '../../types/source';
import { getOperation } from '../operations';
import { makePythonCompatible } from '../operations/factory';
import { isPromiseLike, pythonString } from '../utils';

const initializeWorker = (self, importScripts, loadPyodide) => {
  // TODO: import fetch, allow scriptURL?, handle Source objects
  importScripts('https://cdn.jsdelivr.net/pyodide/v0.21.3/full/pyodide.js');

  let backendLoaded = false;

  function _mapToObject(map) {
    const obj = {};
    for (const [key, value] of map) {
      obj[key] = value;
    }
    return obj;
  }

  async function initialize(options = {}) {
    if (!backendLoaded) {
      options = Object.assign(
        { indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.21.3/full/' },
        options
      );

      self.pyodide = await loadPyodide(options);

      await self.pyodide.loadPackage('micropip');
      self.micropip = self.pyodide.pyimport('micropip');

      await self.micropip.install(
        'https://test-files.pythonhosted.org/packages/4b/41/a3e8331bd09ffcca4834715b4c269fc2cfa5acdfa4fb080f02a3c0acf688/pyoptimus-0.1.40212-py3-none-any.whl'
      );
      self.pyodide.runPython(`
        from optimus import Optimus
        from io import BytesIO
        op = Optimus("pyscript")
        def run_method(method, kwargs):
            return method(**kwargs.to_py())
      `);

      backendLoaded = true;
    }
  }

  let initialization;

  addEventListener(
    'message',
    async (e) => {
      if (typeof e.data !== 'object' || !('type' in e.data)) {
        throw new Error('Invalid message');
      }

      if (e.data.type === 'init') {
        initialization = initialize(e.data.options);

        await initialization;

        self.postMessage({
          type: 'init',
          id: e.data.id,
        });
      } else if (e.data.type === 'load') {
        await initialization;

        if (!backendLoaded) {
          console.warn('Backend not loaded, loading with default options...');
          await initialize();
        }

        if (e.data.packages && e.data.packages.length > 0) {
          await self.pyodide.loadPackage(e.data.packages);
        }

        self.postMessage({
          type: 'load',
          id: e.data.id,
        });
      } else if (e.data.type === 'run') {
        await initialization;

        if (!backendLoaded) {
          console.warn('Backend not loaded, loading with default options...');
          await initialize();
        }

        let result = null;
        let error = null;

        try {
          if (e.data.code) {
            result = self.pyodide.runPython(e.data.code);
          } else {
            const runMethod = self.pyodide.globals.get('run_method');
            result = runMethod(e.data.method, e.data.kwargs);
          }

          try {
            result =
              typeof result?.toJs === 'function'
                ? result.toJs({ dict_converter: _mapToObject })
                : result;
          } catch (error) {
            console.warn('Error converting to JS', error);
          }
        } catch (err) {
          error = err.message;
        }

        try {
          self.postMessage({
            type: 'run',
            id: e.data.id,
            result,
            error,
          });
        } catch (err) {
          if (err.message.includes('could not be cloned')) {
            const source = {} as SourceInterface;
            source.name = e.data.kwargs?.target;
            source._blurrMember = 'source';
            self.postMessage({
              type: 'run',
              id: e.data.id,
              result: source,
            });
          } else {
            self.postMessage({
              type: 'run',
              id: e.data.id,
              result: null,
              error: err.message,
            });
          }
        }
      }
    },
    false
  );
};

const defaultPyodideOptions: PyodideBackendOptions = {
  scriptURL: 'https://cdn.jsdelivr.net/pyodide/v0.21.3/full/pyodide.js',
  local: true,
};

function promiseWorker(url) {
  const worker = new Worker(url);
  const promises = {};
  let currentId = 0;
  worker.onerror = (event) => {
    if (event.error.id) {
      promises[event.error.id].reject(event.error.error);
    } else {
      throw event.error;
    }
  };
  worker.onmessage = (event) => {
    if (!promises[event.data.id]) {
      console.error(event);
      throw new Error(`Promise with id ${event.data.id} not found`);
    }
    if (event.data.error) {
      promises[event.data.id].reject(event.data.error);
    } else {
      promises[event.data.id].resolve(event.data.result);
    }
    delete promises[event.data.id];
  };
  return {
    postMessage: (message) => {
      const id = currentId++;
      const promise = new Promise((resolve, reject) => {
        promises[id] = { resolve, reject };
      });
      worker.postMessage({ id, ...message });
      return promise;
    },
  };
}

async function loadWorker(options: PyodideBackendOptions) {
  if (globalThis.loadedPyodide) {
    console.log('Pyodide worker was already loaded');
    return globalThis.loadedPyodide;
  }

  let content = initializeWorker.toString();

  content = content.substring(
    content.indexOf('{') + 1,
    content.lastIndexOf('}')
  );

  console.log({ content });

  const worker = promiseWorker(window.URL.createObjectURL(new Blob([content])));

  await worker.postMessage({ type: 'init', options });

  globalThis.loadedPyodide = worker;

  return worker;
}

export function ServerPyodideWorker(options: ServerOptions): ServerInterface {
  const server = {} as ServerInterface & { _features: string[] };

  server.options = Object.assign({}, defaultPyodideOptions, options);

  server.worker = null;

  server.backend = null;

  const workerPromise = loadWorker(server.options as PyodideBackendOptions);

  server.backendLoaded = false;

  server.donePromise = workerPromise.then((worker) => {
    server.worker = server.backend = worker;
    server.backendLoaded = true;
    return true;
  });

  server.runCode = async (code: string) => {
    await server.donePromise;
    const result = await server.worker.postMessage({
      type: 'run',
      code,
    });
    return result as PythonCompatible;
  };

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

  server.runMethod = async (source, path, kwargs) => {
    await server.donePromise;
    const result = (await server.worker.postMessage({
      type: 'run',
      source: source.toString(),
      path,
      kwargs,
    })) as PythonCompatible;
    return result;
  };

  server._features = ['buffers', 'callbacks'];

  server.supports = (features: string | Array<string>) => {
    if (typeof features === 'string') {
      features = [features];
    }
    return features.every((feature) => server._features.includes(feature));
  };

  // TODO: prepareBuffer, prepareCallback

  server.setGlobal = (name: string, value: PythonCompatible) => {
    server.runCode(`${name} = ${pythonString(value)}`);
  };

  server.getGlobal = (name: string) => {
    return server.runCode(name) as PromiseOr<PythonCompatible>;
    // TODO: create Source object in worker
  };

  return server;
}
