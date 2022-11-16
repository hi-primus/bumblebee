import test from 'ava';

import { BlurrClient } from '../../client';

test('unique-name', async (t) => {
  const client = BlurrClient();

  const df = await client.readCsv({
    url: 'https://raw.githubusercontent.com/hi-primus/optimus/develop/examples/data/foo.csv',
  });

  t.log('Unique name:', df.name);

  t.deepEqual(await df.cols.names(), [
    'id',
    'firstName',
    'lastName',
    'billingId',
    'product',
    'price',
    'birth',
    'dummyCol',
  ]);

  const countResult = await df.rows.count();

  t.is(countResult, 19);

  t.log('Rows count:', countResult);

  const kwargsResult = await df.columnsSample({ start: 1, stop: 5 });
  const argsResult = await df.columnsSample(1, 5);

  t.deepEqual(kwargsResult, argsResult);

  t.log('Content of the first 5 rows:', kwargsResult);
});
