import fetch from 'cross-fetch';
import { loadPyodide as originalLoadPyodide } from 'pyodide';

import { loadScript } from './utils';

async function loadPyodide(options: PyodideBackendOptions) {
  globalThis.fetch = globalThis?.fetch || fetch;

  // Check if it uses another script

  if (options?.scriptURL) {
    await loadScript(options.scriptURL);
  }

  delete options.scriptURL;

  if (!globalThis?.loadPyodide) {
    console.warn('not found in globalThis, this may break');
  }

  const _loadPyodide: LoadPyodideType =
    globalThis?.loadPyodide || originalLoadPyodide;

  const pyodide = await _loadPyodide(options);

  return pyodide;
}

function BlurrServerPyodide(options: PyodideBackendOptions): Server {
  const pyodidePromise = loadPyodide(options).then(async (pyodide) => {
    await pyodide.loadPackage('micropip');
    const micropip = pyodide.pyimport('micropip');

    await micropip.install('ibis-framework');
    await micropip.install('ibis-framework[duckdb]');
    await micropip.install('sqlalchemy');
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
    run: async (code: string) => {
      await server.donePromise;
      const result = await server.backend.runPythonAsync(code);
      try {
        return typeof result?.toJs === 'function' ? result.toJs() : result;
      } catch (error) {
        console.warn('Error converting to JS', code, error);
        return result;
      }
    },
    _features: ['files'],
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

export function BlurrServer(
  options: BackendOptions = { backend: 'pyodide' }
): Server {
  if (options.backend === 'pyodide') {
    delete options.backend;
    return BlurrServerPyodide(options);
  }

  throw new Error('Cannot initialize a server without a backend');
}
