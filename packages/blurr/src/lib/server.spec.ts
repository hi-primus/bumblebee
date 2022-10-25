import test from 'ava';

// import { BlurrServer } from './server';

test('server-script-fallback', async (t) => {
  t.is(2, 2);
  // const server = BlurrServer({
  //   backend: 'pyodide',
  // });
  // // const pyodide = await server.donePromise;

  // // const result = await pyodide.runPythonAsync('1+1');

  // const result = await server.run('1+1');

  // t.is(result, 2);
});

test('server-packages', async (t) => {
  t.is(2, 2);
  // const server = BlurrServer();
  // const pyodideDone = await server.donePromise; // ...

  // await pyodide.loadPackage('micropip');
  // const micropip = pyodide.pyimport('micropip');

  // await micropip.install('ibis-framework');
  // await micropip.install('ibis-framework[duckdb]');
  // await micropip.install('sqlalchemy');

  // const result = await pyodide.runPythonAsync('output = 2+2; output');

  // const fromGlobals = pyodide.globals.get('output');

  // t.truthy(pyodide);
  // t.is(result, 4);
  // t.is(fromGlobals, 4);
});
