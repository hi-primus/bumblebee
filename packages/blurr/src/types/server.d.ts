import { KernelGatewayBackendOptions } from './kernelgateway';
import { PyodideBackendOptions, PyodideInterface } from './pyodide';

type Backend = 'pyodide' | 'kernel-gateway';

interface RunsCode {
  donePromise: Promise<boolean>;
  supports: (feature: string) => boolean;
  // run: (kwargs: Record<string, PythonCompatible>) => Promise<PythonCompatible>; // use this
  run: (code: string) => Promise<PythonCompatible>;
  setGlobal: (name: string, value) => void;
}

type BackendInterface = PyodideInterface;

interface Server extends RunsCode {
  pyodide?: PyodideInterface;
  backend?: BackendInterface;
  backendLoaded: boolean;
  // runCode: (string) => Promise<PythonCompatible>; TODO: use this instead of run
}

type BackendOptions = PyodideBackendOptions | KernelGatewayBackendOptions;

interface ServerOptions extends BackendOptions {
  backend: Backend;
}
