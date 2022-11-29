import { KernelGatewayBackendOptions } from './kernelgateway';
import {
  PyodideBackendOptions,
  PyodideInterface,
  PyProxyCallable,
} from './pyodide';

export interface RunsCode {
  donePromise: Promise<boolean>;
  supports: (feature: string) => boolean;
  run: (
    kwargs: ArrayOrSingle<Record<string, unknown>>,
    run?: boolean
  ) => PromiseOr<unknown>;
  runCode: (string) => PromiseOr<PythonCompatible>;
  getGlobal: (name: string) => PromiseOr<PythonCompatible>;
  setGlobal: (name: string, value) => PromiseOr<void>;
}

type BackendInterface = PyodideInterface;

export type ServerOptions = PyodideBackendOptions | KernelGatewayBackendOptions;

export interface Server extends RunsCode {
  pyodide?: PyodideInterface;
  options: ServerOptions;
  runMethod?: (
    method: PyProxyCallable,
    kwargs: Record<string, unknown>
  ) => PromiseOr<PythonCompatible>;
  backend?: BackendInterface;
  backendLoaded: boolean;
  run: (
    kwargs: ArrayOrSingle<Record<string, OperationCompatible>>
  ) => PromiseOr<PythonCompatible>;
}
