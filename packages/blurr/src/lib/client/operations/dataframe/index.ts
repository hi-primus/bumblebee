import { BlurrOperation } from '../factory';

function DataframeOperation<T = OperationCompatible>(operationCreator) {
  return BlurrOperation<T>({
    ...operationCreator,
    sourceType: 'dataframe',
  });
}

export const operations = {
  count: DataframeOperation({
    name: 'count',
    getCode: function (kwargs: { source: string }) {
      return `${kwargs.source}.rows.count()`;
    },
  }),
  columns: DataframeOperation({
    name: 'columns|cols',
    getCode: function (kwargs: { source: string }) {
      return `${kwargs.source}.cols.names()`;
    },
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
  hist: DataframeOperation({
    targetType: 'value',
    name: 'hist',
    getCode: function (kwargs: { source: string; cols: string | string[] }) {
      kwargs = Object.assign({ cols: '*' }, kwargs);
      if (Array.isArray(kwargs.cols)) {
        return `${kwargs.source}.cols.hist(["${kwargs.cols.join('", "')}"])`;
      }
      return `${kwargs.source}.cols.hist("${kwargs.cols}")`;
    },
  }),
};
