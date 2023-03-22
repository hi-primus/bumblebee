import type { PyodideBackendOptions } from '../../types/pyodide';
import type { Server as ServerInterface } from '../../types/server';
import type { ServerOptions } from '../../types/server';
import { getOperation } from '../operations';
import { makePythonCompatible } from '../operations/factory';
import { isPromiseLike, pythonString } from '../utils';

import { initializeWorker } from './pyodide-worker-function';

const defaultPyodideOptions: PyodideBackendOptions = {
  scriptURL: 'https://cdn.jsdelivr.net/pyodide/v0.22.1/full/pyodide.js',
  local: true,
};

function hasBuffer(value: unknown): value is { buffer: ArrayBuffer } {
  return (
    value &&
    typeof value === 'object' &&
    'buffer' in value &&
    (value as { buffer: ArrayBuffer }).buffer instanceof ArrayBuffer
  );
}

function toTransferables(value: unknown, transferables: ArrayBuffer[] = []) {
  if (value instanceof ArrayBuffer) {
    transferables.push(value);
    return value;
  } else if (Array.isArray(value)) {
    return value.map((v) => toTransferables(v, transferables));
  } else if (value && typeof value === 'object') {
    const obj = {};
    for (const key in value) {
      obj[key] = toTransferables(value[key], transferables);
    }
    return obj;
  } else {
    return value;
  }
}

function toArrayBuffers(value: unknown) {
  if (value && typeof value === 'object') {
    if (value instanceof ArrayBuffer) {
      return value;
    } else if (hasBuffer(value)) {
      return value.buffer;
    } else if (Array.isArray(value)) {
      return value.map((v) => toArrayBuffers(v));
    } else {
      const obj = {};
      for (const key in value) {
        obj[key] = toArrayBuffers(value[key]);
      }
      return obj;
    }
  } else {
    return value;
  }
}

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
      console.error(
        `Error with id '${event.data.id}' not found. Event:`,
        event
      );
      throw new Error(`Promise with id '${event.data.id}' not found`);
    }
    if (event.data.error) {
      promises[event.data.id].reject(event.data.error);
    } else {
      promises[event.data.id].resolve(event.data.result);
    }
    delete promises[event.data.id];
  };
  return {
    postMessage: (message, transfer: ArrayBuffer[] | null = null) => {
      const id = currentId++;
      const promise = new Promise((resolve, reject) => {
        promises[id] = { resolve, reject };
      });
      worker.postMessage({ id, ...message }, transfer);
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

  const worker = promiseWorker(window.URL.createObjectURL(new Blob([content])));

  try {
    await worker.postMessage({ type: 'init', options });
    globalThis.loadedPyodide = worker;
    return worker;
  } catch (e) {
    console.error('Error loading pyodide worker', e);
    globalThis.loadedPyodide = null;
    return;
  }
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

    if (server.supports('buffers')) {
      return toArrayBuffers(result) as PythonCompatible;
    }
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
      const { kwargs, operation } = operations[i];

      const _operation = (result: OperationCompatible) => {
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

    const transfer: ArrayBuffer[] | null = [];

    if (server.supports('buffers')) {
      kwargs = toTransferables(kwargs, transfer);
    }

    const result = (await server.worker.postMessage(
      {
        type: 'run',
        source: source.toString(),
        path,
        kwargs,
      },
      transfer
    )) as PythonCompatible;

    if (server.supports('buffers')) {
      return toArrayBuffers(result);
    }

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

  server.setGlobal = async (name: string, value: PythonCompatible) => {
    if (value instanceof Function && server.supports('callbacks')) {
      const adaptedValue = {
        [name]: { value: value.toString(), name, _blurrType: 'function' },
      };
      await server.worker.postMessage({
        type: 'setGlobal',
        value: adaptedValue,
      });
      return;
    } else if (value instanceof ArrayBuffer && server.supports('buffers')) {
      const transfer: ArrayBuffer[] = [];
      const adaptedValue = toTransferables({ [name]: value }, transfer);
      await server.worker.postMessage(
        {
          type: 'setGlobal',
          value: adaptedValue,
        },
        transfer
      );
      return;
    } else {
      await server.runCode(`${name} = ${pythonString(value)}`);
      return;
    }
  };

  server.getGlobal = (name: string) => {
    return server.runCode(name) as PromiseOr<PythonCompatible>;
    // TODO: create Source object in worker
  };

  return {
    ...server,
    then: (onFulfilled, onRejected) => {
      workerPromise.then((worker) => {
        server.worker = server.backend = worker;
        server.backendLoaded = true;
        onFulfilled(server);
      }, onRejected);
    },
  } as typeof server;
}
