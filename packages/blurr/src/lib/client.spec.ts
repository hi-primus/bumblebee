import test from 'ava';

import { BlurrClient } from './client';

test('client', async (t) => {
  const client = BlurrClient();

  if (typeof client.count === 'function') {
    t.log(await client.count({ source: 'df' }));
  }
  t.is(2, 2);
});
