import type { Cols, EmptyArgs } from '../../../../types/arguments';
import { pythonArguments } from '../../../utils';
import { BlurrOperation } from '../factory';

function DataframeOperation<
  TA = OperationArgs<OperationCompatible>,
  TR = OperationCompatible
>(operationCreator) {
  return BlurrOperation<TA, TR>({
    ...operationCreator,
    sourceType: 'dataframe',
  });
}

export const operations = {
  frequency: DataframeOperation<{ cols: Cols }, object>({
    targetType: 'value',
    name: 'cols.frequency',
    getCode: function (kwargs: { source: string; cols: Cols }) {
      kwargs = Object.assign({ cols: '*' }, kwargs);
      return `${kwargs.source}.cols.frequency(${pythonArguments(kwargs)})`;
    },
  }),
  histogram: DataframeOperation<{ cols: Cols; buckets: number }, object>({
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
  count: DataframeOperation<EmptyArgs, number>({
    name: 'count',
    getCode: function (kwargs: { source: string }) {
      return `${kwargs.source}.rows.count()`;
    },
  }),
  columns: DataframeOperation<EmptyArgs, string[]>({
    name: 'cols.names',
  }),
  columnsSample: DataframeOperation({
    targetType: 'value',
    name: 'columnsSample',
    getCode: function (kwargs: {
      source: string;
      start: number;
      stop: number;
    }) {
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
