import { loadPyodide as originalLoadPyodide, PyProxy } from 'pyodide/pyodide';
export type { PyodideInterface } from 'pyodide/pyodide';

export type PyodideSourceData = PyProxy;

export type LoadPyodideType = typeof originalLoadPyodide;
export type PyodideOptions = ArgumentTypes<LoadPyodideType>[0];
export interface PyodideBackendOptions extends PyodideOptions {
  scriptURL?: string;
}
