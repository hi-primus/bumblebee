import { BlurrOperation } from '../factory';
import { pythonArguments } from '../../../utils';
import { Cols } from '../../../../types/arguments';

function DataframeOperation<T = OperationCompatible>(operationCreator) {
  return BlurrOperation<T>({
    ...operationCreator,
    sourceType: 'dataframe'
  });
}

export const operations = {
  frequency: DataframeOperation({
    targetType: 'value',
    name: 'cols.frequency',
    getCode: function(kwargs: {
      source: string;
      cols: Cols;
    }) {
      kwargs = Object.assign({ cols: '*' }, kwargs);
      return `${kwargs.source}.cols.frequency(${pythonArguments(kwargs)})`;
    }
  }),
  histogram: DataframeOperation({
    targetType: 'value',
    name: 'histogram',
    getCode: function(kwargs: {
      source: string;
      cols: Cols;
      buckets: number;
    }) {
      kwargs = Object.assign({ cols: '*', buckets: 10 }, kwargs);
      return `${kwargs.source}.cols.hist(${pythonArguments(kwargs)})`;
    }
  }),
  count: DataframeOperation({
    name: 'count',
    getCode: function(kwargs: { source: string }) {
      return `${kwargs.source}.rows.count()`;
    }
  }),
  columns: DataframeOperation({
    name: 'cols.names',
    getCode: function(kwargs: { source: string }) {
      return `${kwargs.source}.cols.names()`;
    }
  }),
  columnsSample: DataframeOperation({
    targetType: 'value',
    name: 'columnsSample',
    getCode: function(kwargs: {
      source: string;
      start: number;
      stop: number;
    }) {
      return (
        `${kwargs.source}[${kwargs.start}: ${kwargs.stop}]` +
        `.columns_sample("*")`
      );
    }
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
