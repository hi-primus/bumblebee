import { RunsCode } from '../../../../types/server';
import { Source } from '../../../../types/source';
import { BlurrOperation } from '../factory';

export const operations = {
  count: BlurrOperation({
    sourceType: 'dataframe',
    name: 'count',
    getCode: function (kwargs: { source: string }) {
      return `${kwargs.source}.rows.count()`;
    },
  }),
  columns: BlurrOperation({
    sourceType: 'dataframe',
    name: 'columns|cols',
    getCode: function (kwargs: { source: string }) {
      return `${kwargs.source}.cols.names()`;
    },
  }),
  columnsSample: BlurrOperation<OperationCompatible>({
    sourceType: 'dataframe',
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
  readCsv: BlurrOperation<Source>({
    sourceType: 'none',
    targetType: 'dataframe',
    name: 'readCsv',
    run: function (
      client: RunsCode,
      kwargs: { target: string; url: string; buffer: string }
    ) {
      if (kwargs.url) {
        return client.run(`${kwargs.target} = op.load.csv('${kwargs.url}')`);
      }
      return client.run(
        `${kwargs.buffer}_py = BytesIO(${kwargs.buffer}.to_py()); ${kwargs.target} = op.load.csv(${kwargs.buffer}_py)`
      );
    },
  }),
};
