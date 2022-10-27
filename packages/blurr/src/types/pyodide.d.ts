import { loadPyodide as originalLoadPyodide } from 'pyodide/pyodide';
export type { PyodideInterface } from 'pyodide/pyodide';

export type LoadPyodideType = typeof originalLoadPyodide;
export type PyodideOptions = ArgumentTypes<LoadPyodideType>[0];
export interface PyodideBackendOptions extends PyodideOptions {
  scriptURL?: string;
}
