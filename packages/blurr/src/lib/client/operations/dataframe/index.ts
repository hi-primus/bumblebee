import type { NoArgs, Source } from '../../../../types/arguments';
import { ArgsType, OperationCreator } from '../../../../types/operation';
import { BlurrOperation } from '../factory';

import { operations as colsOperations } from './cols';
import { operations as rowsOperations } from './rows';

function DataframeOperation<TA extends ArgsType = ArgsType,
  TR extends OperationCompatible = Source>(operationCreator: OperationCreator) {
  return BlurrOperation<TA, TR>({
    ...operationCreator,
    sourceType: 'dataframe',
  });
}

export const operations = {
  ...colsOperations,
  ...rowsOperations,
  columnsSample: DataframeOperation<NoArgs, Source>({
    name: 'columnsSample',
    args: [],
    defaultSource: 'df',

  }),
};


