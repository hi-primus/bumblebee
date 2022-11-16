import test from 'ava';

import { BlurrServer } from './server';

test('server-pyodide', async (t) => {
  const server = BlurrServer({
    backend: 'pyodide',
  });

  await server.donePromise;

  const result = await server.runCode('1+1');

  t.is(result, 2);
});

test('server-default-globals', async (t) => {
  const server = BlurrServer();

  await server.donePromise;

  const result = await server.runCode('output = 2+2; output');

  const fromGlobals = server.pyodide.globals.get('output');

  t.is(result, 4);
  t.is(fromGlobals, 4);
});
