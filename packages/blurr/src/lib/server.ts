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

function BlurrServerPyodide(server: Server, options: PyodideBackendOptions) {
  server.backendPromise = loadPyodide(options).then(async (pyodide) => {
    await pyodide.loadPackage('micropip');
    const micropip = pyodide.pyimport('micropip');

    await micropip.install('ibis-framework');
    await micropip.install('ibis-framework[duckdb]');
    await micropip.install('sqlalchemy');
    return pyodide;
  });

  server.backendPromise.then((pyodide) => {
    server.pyodide = server.backend = pyodide;
    server.backendLoaded = true;
  });

  server.run = async (code: string) => {
    await server.backendPromise;
    const result = await server.backend.runPythonAsync(code);
    return result;
  };
}

/**
 * Initializes a BlurrServer instance
 * ### Example (es module)
 * ```js
 * import { BlurrServer } from 'blurr'
 * const server = BlurrServer({ backend: 'pyodide' });
 * const pyodide = await server.backendPromise;
 * ```
 *
 * @param options - options to initialize, passed to loadPyodide, etc...
 * @param options.backend - "pyodide", "kernel-gateway"
 * @param options.scriptURL - (Pyodide on front-end) Replaces the installed version of pyodide
 */

export function BlurrServer(options: BackendOptions = { backend: 'pyodide' }) {
  const server: Server = { backendLoaded: false };

  if (options.backend === 'pyodide') {
    delete options.backend;
    BlurrServerPyodide(server, options);
  }

  return server;
}
