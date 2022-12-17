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
 * @param options.backend - "pyodide", "kernelgateway"
 * @param options.scriptURL - (Pyodide on front-end) Replaces the installed version of pyodide
 */

import type { ServerOptions } from '../../types/server';
import type { Server as ServerInterface } from '../../types/server';

import { ServerPyodide } from './pyodide';
import { ServerPyodideWorker } from './pyodide-worker';

export const defaultOptions: ServerOptions = { backend: 'pyodide' };

export function Server(
  options: ServerOptions = defaultOptions
): ServerInterface {
  options = Object.assign({}, defaultOptions, options);
  if (options.backend === 'pyodide') {
    delete options.backend;
    if (options.useWorker) {
      options.local = false;
      return ServerPyodideWorker(options);
    }
    return ServerPyodide(options);
  }

  throw new Error('Cannot initialize a server without a backend');
}
