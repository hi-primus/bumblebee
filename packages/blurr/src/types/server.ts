import { RequestOptions, SourceArg } from './arguments';
import { KernelGatewayBackendOptions } from './kernelgateway';
import { PyodideBackendOptions, PyodideInterface } from './pyodide';

export interface RunsCode<T = unknown> {
  donePromise: Promise<boolean>;
  supports: (feature: string) => boolean;
  run: (
    kwargs: ArrayOrSingle<Params>,
    options?: RequestOptions
  ) => PromiseOr<T>;
  runCode: (code: string, options?: RequestOptions) => PromiseOr<T>;
  getGlobal: (name: string, options?: RequestOptions) => PromiseOr<T>;
  setGlobal: (
    name: string,
    value: PythonCompatible,
    options?: RequestOptions
  ) => PromiseOr<void>;
}
interface PromiseWorker {
  postMessage: (
    message: unknown,
    transfer?: Transferable[] | null
  ) => Promise<unknown>;
}

type BackendInterface = PyodideInterface | PromiseWorker;

export type ServerOptions = PyodideBackendOptions | KernelGatewayBackendOptions;

export interface Server extends RunsCode<PythonCompatible> {
  pyodide?: PyodideInterface;
  worker?: PromiseWorker;
  options: ServerOptions;
  backend?: BackendInterface;
  backendLoaded: boolean;
  runMethod?: (
    source: SourceArg,
    method: string,
    kwargs: Record<string, unknown>,
    options?: RequestOptions
  ) => PromiseOr<PythonCompatible>;
}
