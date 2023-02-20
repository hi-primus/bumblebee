import { SourceArg } from './arguments';
import { KernelGatewayBackendOptions } from './kernelgateway';
import { PyodideBackendOptions, PyodideInterface } from './pyodide';

export interface RunsCode {
  donePromise: Promise<boolean>;
  supports: (feature: string) => boolean;
  run: (
    kwargs: ArrayOrSingle<Record<string, unknown>>,
    run?: boolean
  ) => PromiseOr<unknown>;
  runCode: (string) => PromiseOr<unknown>;
  getGlobal: (name: string) => PromiseOr<PythonCompatible>;
  setGlobal: (name: string, value) => PromiseOr<void>;
}
interface PromiseWorker {
  postMessage: (
    message: unknown,
    transfer?: Transferable[] | null
  ) => Promise<unknown>;
}

type BackendInterface = PyodideInterface | PromiseWorker;

export type ServerOptions = PyodideBackendOptions | KernelGatewayBackendOptions;

export interface Server extends RunsCode {
  pyodide?: PyodideInterface;
  worker?: PromiseWorker;
  options: ServerOptions;
  runMethod?: (
    source: SourceArg,
    method: string,
    kwargs: Record<string, unknown>
  ) => PromiseOr<PythonCompatible>;
  backend?: BackendInterface;
  backendLoaded: boolean;
  run: (
    kwargs: ArrayOrSingle<Record<string, OperationCompatible>>
  ) => PromiseOr<PythonCompatible>;
}
