import test from 'ava';

import { BlurrClient } from './client';

test('client', async (t) => {
  const client = BlurrClient();

  const df = await client.readCsv({
    url: 'https://raw.githubusercontent.com/hi-primus/optimus/develop/examples/data/foo.csv',
    target: 'df',
  });

  t.truthy(df);
  t.is(df.name, 'df');
});
