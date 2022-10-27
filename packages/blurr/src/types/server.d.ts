import { loadPyodide as originalLoadPyodide } from 'pyodide/pyodide';
import type { PyodideInterface } from 'pyodide/pyodide';

type Backend = 'pyodide' | 'kernel-gateway';

declare global {
  interface RunsCode {
    donePromise: Promise<boolean>;
    supports: (string) => boolean;
    run: (string) => Promise<PythonCompatible>;
    setGlobal: (string, any) => void;
  }
  type LoadPyodideType = typeof originalLoadPyodide;
  type BackendInterface = PyodideInterface;
  interface Server extends RunsCode {
    pyodide?: PyodideInterface;
    backend?: BackendInterface;
    backendLoaded: boolean;
  }
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
