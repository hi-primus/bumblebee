import type { ArgsType, OperationCreator } from '../../../types/operation';
import type { Source } from '../../../types/source';
import { BlurrOperation } from '../factory';

function DataframeCreationOperation<
  TA extends ArgsType = ArgsType,
  TR extends OperationCompatible = Source
>(operationCreator: OperationCreator) {
  return BlurrOperation<TA, TR>({
    ...operationCreator,
    sourceType: 'none',
    targetType: 'dataframe',
  });
}

export const operations = {
  createDataframe: DataframeCreationOperation<{
    data: Record<string, PythonCompatible>;
  }>({
    name: 'create.dataframe',
    defaultSource: 'op',
    args: [{ name: 'data' }],
  }),
  readCsv: DataframeCreationOperation<{
    url?: string;
    buffer?: string;
    nRows?: number;
  }>({
    name: 'readCsv',
    args: [
      {
        name: 'url',
      },
      {
        name: 'buffer',
      },
      {
        name: 'nRows',
      },
    ],
    getCode: function (kwargs: {
      target: string;
      url: string;
      buffer: string;
      n_rows: number;
    }) {
      if (kwargs.url) {
        return (
          (kwargs.target ? `${kwargs.target} = ` : '') +
          `op.load.csv('${kwargs.url}'` +
          (kwargs.n_rows ? `, n_rows=${kwargs.n_rows}` : '') +
          `)`
        );
      }
      if (kwargs.buffer) {
        return (
          `${kwargs.buffer}_py = BytesIO(${kwargs.buffer}.to_py());` +
          (kwargs.target ? `${kwargs.target} = ` : '') +
          `op.load.csv(${kwargs.buffer}_py` +
          (kwargs.n_rows ? `, n_rows=${kwargs.n_rows}` : '') +
          `)`
        );
      }
      throw new Error("Either 'url' or 'buffer' must be provided");
    },
  }),
  readFile: DataframeCreationOperation<{
    url?: string;
    buffer?: string;
    nRows?: number;
  }>({
    name: 'readFile',
    args: [
      {
        name: 'url',
      },
      {
        name: 'buffer',
      },
      {
        name: 'nRows',
      },
    ],
    getCode: function (kwargs: {
      target: string;
      url: string;
      buffer: string;
      n_rows: number;
    }) {
      if (kwargs.url) {
        return (
          (kwargs.target ? `${kwargs.target} = ` : '') +
          `op.load.file('${kwargs.url}'` +
          (kwargs.n_rows ? `, n_rows=${kwargs.n_rows}` : '') +
          `)`
        );
      }
      if (kwargs.buffer) {
        return (
          `${kwargs.buffer}_py = BytesIO(${kwargs.buffer}.to_py());` +
          (kwargs.target ? `${kwargs.target} = ` : '') +
          `op.load.file(${kwargs.buffer}_py)`
        );
      }
      throw new Error("Either 'url' or 'buffer' must be provided");
    },
  }),
};
