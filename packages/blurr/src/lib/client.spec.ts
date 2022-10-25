import test from 'ava';

import { BlurrClient } from './client';

test('client', async (t) => {
  const client = BlurrClient();

  const df = await client.readCsv({
    url: 'https://raw.githubusercontent.com/hi-primus/optimus/develop/examples/data/foo.csv',
    target: 'df',
  });

  t.deepEqual(await client.columns({ source: df }), [
    'id',
    'firstName',
    'lastName',
    'billingId',
    'product',
    'price',
    'birth',
    'dummyCol',
  ]);

  t.is(await client.count({ source: 'df' }), 19);
});
