import type { Cols, NoArgs } from '../../../../types/arguments';
import { ArgsType, OperationCreator } from '../../../../types/operation';
import { pythonArguments } from '../../../utils';
import { BlurrOperation } from '../factory';

function DataframeOperation<
  TA extends ArgsType = ArgsType,
  TR extends OperationCompatible = OperationCompatible
>(operationCreator: OperationCreator) {
  return BlurrOperation<TA, TR>({
    ...operationCreator,
    sourceType: 'dataframe',
  });
}

export const operations = {
  frequency: DataframeOperation<{ cols: Cols }>({
    targetType: 'value' as const,
    name: 'cols.frequency',
    getCode: function (kwargs: { source: string; cols: Cols }) {
      kwargs = Object.assign({ cols: '*' }, kwargs);
      return `${kwargs.source}.cols.frequency(${pythonArguments(kwargs)})`;
    },
  }),
  histogram: DataframeOperation<{ cols: Cols; buckets: number }>({
    targetType: 'value',
    name: 'histogram',
    getCode: function (kwargs: {
      source: string;
      cols: Cols;
      buckets: number;
    }) {
      kwargs = Object.assign({ cols: '*', buckets: 10 }, kwargs);
      return `${kwargs.source}.cols.hist(${pythonArguments(kwargs)})`;
    },
  }),
  count: DataframeOperation<NoArgs, number>({
    name: 'count',
    getCode: function (kwargs: { source: string }) {
      return `${kwargs.source}.rows.count()`;
    },
  }),
  columns: DataframeOperation<NoArgs, string[]>({
    name: 'cols.names',
  }),
  columnsSample: DataframeOperation<{ start: number; stop: number }>({
    targetType: 'value',
    name: 'columnsSample',
    args: {
      start: 0,
      stop: 10,
    },
    getCode: function (kwargs) {
      return (
        `${kwargs.source}[${kwargs.start}: ${kwargs.stop}]` +
        `.columns_sample("*")`
      );
    },
  }),
  // hist: DataframeOperation({
  //   targetType: 'value',
  //   name: 'hist',
  //   getCode: function(kwargs: { source: string; cols: string | string[] }) {
  //     kwargs = Object.assign({ cols: '*' }, kwargs);
  //     if (Array.isArray(kwargs.cols)) {
  //       return `${kwargs.source}.cols.hist(["${kwargs.cols.join('", "')}"])`;
  //     }
  //     return `${kwargs.source}.cols.hist("${kwargs.cols}")`;
  //   }
  // })
};
