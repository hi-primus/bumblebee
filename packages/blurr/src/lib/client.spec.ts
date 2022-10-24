import test from 'ava';

import { BlurrClient } from './client';

test('client', async (t) => {
  const client = BlurrClient();

  if (typeof client.readCsv === 'function') {
    const sdf = await client.readCsv({
      target: 'df',
      url: 'https://raw.githubusercontent.com/hi-primus/optimus/develop/examples/data/foo.csv',
    });
    t.log(sdf);
    if (typeof sdf.columns === 'function') {
      t.log(await sdf.columns());
    }
    if (typeof sdf.count === 'function') {
      t.log(await sdf.count());
    }
  }

  t.is(2, 2);
});
