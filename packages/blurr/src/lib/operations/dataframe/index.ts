import { Cols, NoArgs } from '../../../types/arguments';
import { ArgsType, OperationCreator } from '../../../types/operation';
import { Source } from '../../../types/source';
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
  columnsSample: DataframeOperation<NoArgs, PythonCompatible>({
    name: 'columnsSample',
    targetType: 'value',
  }),
  iloc: DataframeOperation<{ lower_bound: number; upper_bound: number }>({
    name: 'iloc',
    targetType: 'dataframe',
    args: [{ name: 'lower_bound' }, { name: 'upper_bound' }],
  }),
  profile: DataframeOperation<{ cols: Cols; bins: number; flush: boolean }>({
    targetType: 'value',
    name: 'profile',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'bins',
        default: 10,
      },
      {
        name: 'flush',
        default: false,
      },
    ],
  }),
};
