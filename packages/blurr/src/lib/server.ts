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
  server.backendPromise = loadPyodide(options);

  server.backendPromise.then((pyodide) => {
    server.pyodide = server.backend = pyodide;
    server.backendLoaded = true;
  });

  server.run = async (code: string) => {
    await server.backendPromise;
    return await server.backend.runPythonAsync(code);
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
  let server: Server = { backendLoaded: false };

  if (options.backend === 'pyodide') {
    delete options.backend;
    BlurrServerPyodide(server, options);
  }

  return server as Readonly<Server>;
}
