import test from 'ava';

import { BlurrServer } from './server';

test('server-script-fallback', async (t) => {
  const server = BlurrServer({
    backend: 'pyodide',
    scriptURL: 'https://cdn.jsdelivr.net/pyodide/v0.21.3/full/pyodide.js',
  });
  const pyodide = await server.backendPromise;

  const result = await pyodide.runPythonAsync('1+1');

  t.truthy(pyodide);
  t.is(result, 2);
});

test('server-packages', async (t) => {
  const server = BlurrServer();
  const pyodide = await server.backendPromise;

  await pyodide.loadPackage('micropip');
  const micropip = pyodide.pyimport('micropip');

  await micropip.install('ibis-framework');
  await micropip.install('ibis-framework[duckdb]');
  await micropip.install('sqlalchemy');

  const result = await pyodide.runPythonAsync('output = 2+2; output');

  const fromGlobals = pyodide.globals.get('output');

  t.truthy(pyodide);
  t.is(result, 4);
  t.is(fromGlobals, 4);
});
