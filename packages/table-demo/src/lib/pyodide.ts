import { BlurrServer } from 'blurr';

import { browser } from '$app/environment';
import { loadScript } from '$lib/utils';

let pyodidePromise: Promise<any>;

import { plainText as INITIALIZATION } from '$lib/python/initialization.py';

export async function loadPyodide() {

  if (pyodidePromise) {
    return await pyodidePromise;
  }

  // if (!browser) {
  //   return null;
  // }

  // try {
  //   await loadScript('https://cdn.jsdelivr.net/pyodide/v0.21.3/full/pyodide.js');
  // } catch (error) {
  //   console.error("Error loading script", error);
  // }

  const server = BlurrServer({ 
    backend: "pyodide",
    scriptURL: 'https://cdn.jsdelivr.net/pyodide/v0.21.3/full/pyodide.js',
  });

  await server.donePromise;

  const pyodide: any = server.pyodide;

  await pyodide.loadPackage('micropip');
  const micropip = pyodide.pyimport('micropip');
  await micropip.install('ibis-framework');
  await micropip.install('ibis-framework[duckdb]');
  await micropip.install('sqlalchemy');
  // await micropip.install('duckdb');
  // await micropip.install('pyarrow');


  await pyodide.runPythonAsync(INITIALIZATION);

  return pyodide;
}

export async function runScript(code: string) {

  let pyodide = await loadPyodide();

  if (!pyodide) {
    return null;
  }

  let result = await pyodide.runPythonAsync(code);

  if (typeof result?.toJs === 'function') {
    try {
      let _result = result.toJs({dict_converter : Object.fromEntries});
      result = _result;
    } catch (err) {
      console.error(err)
    }
  }

  return result;
}

