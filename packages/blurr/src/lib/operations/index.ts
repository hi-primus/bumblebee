import type { Operation } from '../../types/operation';

import { operations as clientOperations } from './client';
import { operations as dataframeOperations } from './dataframe';
import { operations as colsOperations } from './dataframe/cols';
import { operations as rowsOperations } from './dataframe/rows';

const allOperations = {
  client: clientOperations,
  dataframe: dataframeOperations,
  cols: colsOperations,
  rows: rowsOperations,
};

export function getOperation(
  key: string,
  operationType: OperationType
): Operation {
  return allOperations[operationType][key];
}
