import { loadPyodide as originalLoadPyodide } from 'pyodide/pyodide';
import type { PyodideInterface } from 'pyodide/pyodide';

type Backend = 'pyodide' | 'kernel-gateway';

declare global {
  type LoadPyodideType = typeof originalLoadPyodide;
  type BackendInterface = PyodideInterface;
  // eslint-disable-next-line functional/no-mixed-type
  type Server = {
    pyodide?: PyodideInterface;
    backend?: BackendInterface;
    backendPromise?: Promise<BackendInterface>;
    backendLoaded: boolean;
    run?: (string) => Promise<unknown>;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type KernelGatewayBackendOptions = any;
  type PyodideOptions = ArgumentTypes<LoadPyodideType>[0];
  interface PyodideBackendOptions extends PyodideOptions {
    scriptURL?: string;
  }
  type BackendOptions = PyodideBackendOptions | KernelGatewayBackendOptions;
  interface ServerOptions extends BackendOptions {
    backend: Backend;
  }
}

export declare function BlurrServer(options?: ServerOptions): Server;
