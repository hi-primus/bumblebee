import test from 'ava';

import { Blurr } from './client';

test('client', async (t) => {
  const blurr = Blurr();

  const df = await blurr.readFile({
    url: 'https://raw.githubusercontent.com/hi-primus/optimus/develop/examples/data/foo.csv',
    target: 'df',
  });

  t.truthy(df);
  t.is(df.name, 'df');
});
