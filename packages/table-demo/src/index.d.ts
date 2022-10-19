import type { PyodideInterface } from "pyodide";

export {};

declare global {
  interface Window {
    _file: File;
    run: function;
    pyodide: PyodideInterface | null
  }
}