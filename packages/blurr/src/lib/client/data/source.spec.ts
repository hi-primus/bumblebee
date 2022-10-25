import test from 'ava';

import { BlurrClient } from '../../client';

test('unique-name', async (t) => {
  const client = BlurrClient();

  const df = await client.readCsv({
    url: 'https://raw.githubusercontent.com/hi-primus/optimus/develop/examples/data/foo.csv',
  });

  t.log('Name:', df.name);

  t.deepEqual(await df.columns(), [
    'id',
    'firstName',
    'lastName',
    'billingId',
    'product',
    'price',
    'birth',
    'dummyCol',
  ]);

  t.is(await df.count(), 19);

  t.log(await df.columnsSample());
});
