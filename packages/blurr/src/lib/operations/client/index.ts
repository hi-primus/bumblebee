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
  readCsv: DataframeCreationOperation<{ url?: string; buffer?: string }>({
    name: 'readCsv',
    args: [
      {
        name: 'url',
      },
      {
        name: 'buffer',
      },
    ],
    getCode: function (kwargs: {
      target: string;
      url: string;
      buffer: string;
    }) {
      if (kwargs.url) {
        return (
          (kwargs.target ? `${kwargs.target} = ` : '') +
          `op.load.csv('${kwargs.url}')`
        );
      }
      if (kwargs.buffer) {
        return (
          `${kwargs.buffer}_py = BytesIO(${kwargs.buffer}.to_py());` +
          (kwargs.target ? `${kwargs.target} = ` : '') +
          `op.load.csv(${kwargs.buffer}_py)`
        );
      }
      throw new Error('Either url or buffer must be provided');
    },
  }),
  createDataframe: DataframeCreationOperation<{
    data: Record<string, PythonCompatible>;
  }>({
    name: 'create.dataframe',
    defaultSource: 'op',
    args: [{ name: 'data' }],
  }),
};
