import { Name, NoArgs } from '../../../types/arguments';
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
  iloc: DataframeOperation<{ start: number; stop: number }>({
    name: 'columnsSample',
    targetType: 'dataframe',
    args: [{ name: 'start' }, { name: 'stop' }],
    getCode: (kwargs: {
      source: Name;
      target: Name;
      start: number;
      stop: number;
    }) => {
      const indices = `[${kwargs.start}:${kwargs.stop}]`;
      return `${kwargs.target.toString()} = ${kwargs.source.toString()}${indices}`;
    },
  }),
};
