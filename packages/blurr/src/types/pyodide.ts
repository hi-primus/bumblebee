import { loadPyodide as originalLoadPyodide, PyProxy } from 'pyodide/pyodide';
export type { PyodideInterface, PyProxyCallable } from 'pyodide/pyodide';

export type PyodideSourceData = PyProxy;

export type LoadPyodideType = typeof originalLoadPyodide;
export type PyodideOptions = ArgumentTypes<LoadPyodideType>[0];
export interface PyodideBackendOptions extends PyodideOptions {
  backend?: 'pyodide';
  scriptURL?: string;
  local?: boolean;
  useWorker?: boolean;
}
