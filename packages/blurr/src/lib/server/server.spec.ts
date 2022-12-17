import test from 'ava';

import { Server } from './index';

test('server-pyodide', async (t) => {
  const server = Server({
    backend: 'pyodide',
  });

  await server.donePromise;

  const result = await server.runCode('1+1');

  t.is(result, 2);
});

test('server-default-globals', async (t) => {
  const server = Server();

  await server.donePromise;

  const result = await server.runCode('output = 2+2; output');

  const fromGlobals = server.pyodide.globals.get('output');

  t.is(result, 4);
  t.is(fromGlobals, 4);
});
