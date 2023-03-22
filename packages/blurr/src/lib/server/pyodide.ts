import crossFetch from 'cross-fetch';
import * as pyodidePackage from 'pyodide';

import { Source } from '../../types';
import type {
  LoadPyodideType,
  PyodideBackendOptions,
} from '../../types/pyodide';
import type { RunsCode, Server as ServerInterface } from '../../types/server';
import type { ServerOptions } from '../../types/server';
import { isSource } from '../client/data/source';
import { getOperation } from '../operations';
import { makePythonCompatible } from '../operations/factory';
import { isPromiseLike, loadScript } from '../utils';

const defaultPyodideOptions: PyodideBackendOptions = {
  scriptURL: 'https://cdn.jsdelivr.net/pyodide/v0.22.1/full/pyodide.js',
  local: true,
};

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace globalThis {
  let fetch: typeof crossFetch;
  let loadPyodide: LoadPyodideType;
  let loadedPyodide: pyodidePackage.PyodideInterface;
}

async function loadPyodide(
  options: PyodideBackendOptions
): Promise<pyodidePackage.PyodideInterface> {
  if (globalThis.loadedPyodide) {
    console.log('Pyodide was already loaded');
    return globalThis.loadedPyodide;
  }

  globalThis.fetch = globalThis?.fetch || crossFetch;

  if (options?.scriptURL) {
    console.log('Loading pyodide from script', options.scriptURL);
    await loadScript(options.scriptURL);
  }

  if (!globalThis?.loadPyodide) {
    console.warn(
      'loadPyodide function not found in globalThis, this may break'
    );
  }

  const _loadPyodide: LoadPyodideType =
    globalThis?.loadPyodide || pyodidePackage?.loadPyodide;

  delete options.scriptURL;
  delete options.useWorker;

  const pyodide = await _loadPyodide(options as Parameters<LoadPyodideType>[0]);

  globalThis.loadedPyodide = pyodide;

  return pyodide;
}

function _mapToObject<T>(map: Map<string, T>): Record<string, T> {
  const obj: Record<string, T> = {};
  for (const [key, value] of map) {
    obj[key] = value;
  }
  return obj;
}

export function ServerPyodide(options: ServerOptions): ServerInterface {
  const server = {} as ServerInterface & { _features: string[] };

  server.options = Object.assign({}, defaultPyodideOptions, options);

  const pyodidePromise = loadPyodide(
    server.options as PyodideBackendOptions
  ).then(async (pyodide) => {
    await pyodide.loadPackage('micropip');
    const micropip = pyodide.pyimport('micropip');

    await micropip.install(
      'https://test-files.pythonhosted.org/packages/97/f1/01ff74a031b57c83c11563fd1f0b7330279640bce275f5b290a3b3cc0b32/pyoptimus-0.1.4052-py3-none-any.whl'
    );
    pyodide.runPython(`
      from optimus import Optimus
      from io import BytesIO
      from optimus.expressions import parse, parsed_function
      from optimus.engines.base.meta import Meta
      
      op = Optimus("pyodide")

      def run_method(method, kwargs):
          return method(**kwargs.to_py())
          
      def save_csv(df):
          pdf = df.data
          from io import BytesIO, TextIOWrapper
          buffer = BytesIO()
          charset = 'utf-8'
          wrapper = TextIOWrapper(buffer, encoding=charset)
          pdf.to_csv(wrapper, header=True, index=False, encoding=charset, date_format='%Y-%m-%dT%H:%M:%S.%fZ')
          wrapper.flush()
          return buffer.getvalue()
    `);
    return pyodide;
  });

  server.pyodide = undefined;

  server.backend = undefined;

  server.backendLoaded = false;

  server.donePromise = pyodidePromise.then((pyodide) => {
    server.pyodide = server.backend = pyodide;
    server.backendLoaded = true;
    return true;
  });

  function _optionalPromise<T>(callback: T) {
    if (typeof callback === 'function') {
      type _Function = T extends (...args: unknown[]) => unknown
        ? T
        : (...args: unknown[]) => unknown;
      return function (
        ...args: Parameters<_Function>
      ): PromiseOr<Awaited<ReturnType<_Function>>> {
        if (server.backendLoaded) {
          return callback(...args);
        }
        return server.donePromise.then(() => callback(...args)) as Awaited<
          ReturnType<_Function>
        >;
      };
    }
    return callback;
  }

  server.runCode = _optionalPromise(async (code: string) => {
    if (!server.pyodide) {
      server.pyodide = await pyodidePromise;
    }
    const result = server.pyodide.runPython(code);
    try {
      return typeof result?.toJs === 'function'
        ? (result.toJs({ dict_converter: _mapToObject }) as PythonCompatible)
        : (result as PythonCompatible);
    } catch (error) {
      console.warn(`Error converting to JS. \n`, `${code}\n`, error);
      return result as PythonCompatible;
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

    return operations.reduce((promise: PromiseOr<PythonCompatible>, _, i) => {
      const { operation, kwargs } = operations[i];

      const _operation = (result: PythonCompatible) => {
        if (
          i > 0 &&
          !kwargs.source &&
          operation.sourceType === 'dataframe' &&
          operations[i - 1].operation.targetType === 'dataframe' &&
          result !== undefined
        ) {
          kwargs.source = makePythonCompatible(
            server as RunsCode,
            result,
            server.options.local
          );
        }

        return operation.run(server as RunsCode, kwargs);
      };

      if (isPromiseLike(promise)) {
        return promise.then(_operation) as Promise<PythonCompatible>;
      }

      return _operation(promise) as Promise<PythonCompatible>;
    }, undefined) as unknown as PromiseOr<PythonCompatible>;
  };

  server.runMethod = _optionalPromise(
    (source: Source, path: string, kwargs: Kwargs) => {
      let sourceProxy: pyodidePackage.PyProxy;

      if (typeof source === 'string') {
        sourceProxy = server.pyodide.globals.get('source');
      } else if (isSource(source)) {
        sourceProxy =
          source.data || server.pyodide.globals.get(source.toString());
      } else if (server.pyodide.isPyProxy(source)) {
        sourceProxy = source;
      } else {
        throw new Error(
          `Invalid source type '${typeof source}' for method '${path}'`
        );
      }

      const pathAccessors = path.split('.');

      const method = pathAccessors.reduce((obj, key, index) => {
        if (obj && key in obj) {
          return obj[key];
        }
        if (index === pathAccessors.length - 1) {
          return obj[key];
        }
        throw new Error(`Method or accessor '${key}' not found in '${obj}'`);
      }, sourceProxy);

      console.log('[METHOD FROM DEFAULT GENERATOR]', path);

      delete kwargs.source;
      delete kwargs.target;

      const runMethod = server.pyodide.globals.get('run_method');
      const result = runMethod(method, kwargs);
      try {
        return typeof result?.toJs === 'function'
          ? result.toJs({ dict_converter: _mapToObject })
          : result;
      } catch (error) {
        console.warn('Error converting to JS.', error);
        return result;
      }
    }
  );

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

  return {
    ...server,
    then: (onFulfilled, onRejected) => {
      pyodidePromise.then((pyodide) => {
        server.pyodide = server.backend = pyodide;
        server.backendLoaded = true;
        onFulfilled(server);
      }, onRejected);
    },
  } as typeof server;
}
