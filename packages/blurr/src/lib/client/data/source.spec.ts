import test from 'ava';

import { Blurr } from '../../client';

test('unique-name', async (t) => {
  const blurr = Blurr();

  const df = blurr.readFile({
    url: 'https://raw.githubusercontent.com/hi-primus/optimus/develop/examples/data/foo.csv',
  });

  t.log('Unique name:', df.name);

  const names = await df.cols.names();

  t.deepEqual(names, [
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

  const kwargsResult = await df.iloc({ start: 1, stop: 5 }).columnsSample();
  const argsResult = await df.iloc(1, 5).columnsSample();

  t.deepEqual(kwargsResult, argsResult);

  t.log('Content of the first 5 rows:', kwargsResult);
});
