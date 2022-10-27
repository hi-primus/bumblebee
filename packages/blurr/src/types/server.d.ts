import { KernelGatewayBackendOptions } from './kernelgateway';
import { PyodideBackendOptions, PyodideInterface } from './pyodide';

type Backend = 'pyodide' | 'kernel-gateway';

interface RunsCode {
  donePromise: Promise<boolean>;
  supports: (string) => boolean;
  run: (string) => Promise<PythonCompatible>;
  setGlobal: (string, any) => void;
}

type BackendInterface = PyodideInterface;
interface Server extends RunsCode {
  pyodide?: PyodideInterface;
  backend?: BackendInterface;
  backendLoaded: boolean;
}

type BackendOptions = PyodideBackendOptions | KernelGatewayBackendOptions;

interface ServerOptions extends BackendOptions {
  backend: Backend;
}
