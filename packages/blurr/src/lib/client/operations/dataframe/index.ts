import { NoArgs } from '../../../../types/arguments';
import { ArgsType, OperationCreator } from '../../../../types/operation';
import { Source } from '../../../../types/source';
import { BlurrOperation } from '../factory';

function DataframeOperation<
  TA extends ArgsType = ArgsType,
  TR extends OperationCompatible = Source
>(operationCreator: OperationCreator) {
  return BlurrOperation<TA, TR>({
    ...operationCreator,
    sourceType: 'dataframe',
  });
}

export const operations = {
  columnsSample: DataframeOperation<{ start: number; stop: number }>({
    name: 'columnsSample',
    targetType: 'dataframe',
    args: [
      {
        name: 'start',
        default: 0,
      },
      {
        name: 'stop',
        default: 10,
      },
    ],
  }),
};
