import test from 'ava';

import { BlurrClient } from './client';

test('client', async (t) => {
  const client = BlurrClient();
  t.truthy(client);

  t.log(client.readCsv);
  t.log(typeof client.readCsv);

  const sdf = await client.readCsv({
    target: 'df',
    url: 'https://raw.githubusercontent.com/hi-primus/optimus/develop/examples/data/foo.csv',
  });
  t.log(await sdf.columns());
  t.log(await sdf.count());

  t.is(2, 2);
});
