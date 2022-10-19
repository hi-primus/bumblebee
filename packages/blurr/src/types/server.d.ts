import { loadPyodide as originalLoadPyodide } from 'pyodide/pyodide';
import type { PyodideInterface } from 'pyodide/pyodide';

type Backend = 'pyodide' | 'kernel-gateway';

declare global {
  type LoadPyodideType = typeof originalLoadPyodide;
  type BackendInterface = PyodideInterface;
  type Server = {
    pyodide?: PyodideInterface;
    backend?: BackendInterface;
    backendPromise?: Promise<BackendInterface>;
    backendLoaded: boolean;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type KernelGatewayBackendOptions = any;
  type PyodideOptions = ArgumentTypes<LoadPyodideType>[0];
  interface PyodideBackendOptions extends PyodideOptions {
    scriptURL?: string;
  }
  type BackendOptions = PyodideBackendOptions | KernelGatewayBackendOptions;
  interface Options extends BackendOptions {
    backend: Backend;
  }
}

export declare function BlurrServer(options?: Options): Server;
