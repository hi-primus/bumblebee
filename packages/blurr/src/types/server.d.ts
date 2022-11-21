import { KernelGatewayBackendOptions } from './kernelgateway';
import { PyodideBackendOptions, PyodideInterface } from './pyodide';

type Backend = 'pyodide' | 'kernel-gateway';

interface RunsCode {
  donePromise: Promise<boolean>;
  supports: (feature: string) => boolean;
  run: (
    kwargs: ArrayOrSingle<Record<string, unknown>>,
    run?: boolean
  ) => PromiseOr<unknown>;
  runCode: (string) => Promise<PythonCompatible>;
  setGlobal: (name: string, value) => void;
}

type BackendInterface = PyodideInterface;

interface Server extends RunsCode {
  pyodide?: PyodideInterface;
  backend?: BackendInterface;
  backendLoaded: boolean;
  run: (
    kwargs: ArrayOrSingle<Record<string, OperationCompatible>>
  ) => Promise<PythonCompatible>;
}

type BackendOptions = PyodideBackendOptions | KernelGatewayBackendOptions;

interface ServerOptions extends BackendOptions {
  backend: Backend;
}
