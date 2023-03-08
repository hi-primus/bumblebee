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
import { isObject } from '../utils';

import { ServerPyodide } from './pyodide';
import { ServerPyodideWorker } from './pyodide-worker';
import { PubSub } from './queue';

export const defaultOptions: ServerOptions = { backend: 'pyodide' };

export function Server(
  options: ServerOptions = defaultOptions
): ServerInterface {
  options = Object.assign({}, defaultOptions, options);
  let backendServer: ServerInterface;
  if (options.backend === 'pyodide') {
    delete options.backend;
    if (options.useWorker) {
      options.local = false;
      backendServer = ServerPyodideWorker(options);
    } else {
      backendServer = ServerPyodide(options);
    }
  } else {
    throw new Error('Cannot initialize a server without a backend');
  }

  const server = { ...backendServer } as ServerInterface;

  const process = async (payload: unknown) => {
    if (!isObject(payload) || !payload.type) {
      throw new Error(`Unknown payload received of type '${typeof payload}'`);
    }

    if (
      typeof payload.type !== 'string' ||
      !['runMethod', 'runCode', 'run', 'getGlobal', 'setGlobal'].includes(
        payload.type
      )
    ) {
      throw new Error(`Unknown type received: ${payload.type}`);
    }

    payload.args = payload.args || [];

    if (!Array.isArray(payload.args)) {
      throw new Error(`Unknown args received: ${payload.args}`);
    }

    return await backendServer[payload.type](...payload.args);
  };

  const queue = PubSub(process);

  server.runMethod = async (source, method, kwargs, options = {}) => {
    return await new Promise((resolve, reject) => {
      queue.publish(
        'blurr',
        { type: 'runMethod', args: [source, method, kwargs] },
        (result: PythonCompatible, err: Error) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        },
        options.category,
        options.priority
      );
    });
  };

  server.runCode = async (code, options = {}) => {
    return await new Promise((resolve, reject) => {
      queue.publish(
        'blurr',
        { type: 'runCode', args: [code, options] },
        (result: PythonCompatible, err: Error) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        },
        options.category,
        options.priority
      );
    });
  };

  server.run = async (kwargs, options = {}) => {
    return await new Promise((resolve, reject) => {
      queue.publish(
        'blurr',
        { type: 'run', args: [kwargs, options] },
        (result: PythonCompatible, err: Error) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        },
        options.category,
        options.priority
      );
    });
  };

  server.getGlobal = async (name, options = {}) => {
    return await new Promise((resolve, reject) => {
      queue.publish(
        'blurr',
        { type: 'getGlobal', args: [name, options] },
        (result: PythonCompatible, err: Error) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        },
        options.category,
        options.priority
      );
    });
  };

  server.setGlobal = async (name, value, options = {}) => {
    return await new Promise((resolve, reject) => {
      queue.publish(
        'blurr',
        { type: 'setGlobal', args: [name, value, options] },
        (_result, err?: Error) => {
          if (err instanceof Error) {
            reject(err);
          } else {
            resolve();
          }
        },
        options.category,
        options.priority
      );
    });
  };

  return server;
}
