import { ArgsType, OperationCreator } from '../../../types/operation';
import { Source } from '../../../types/source';
import { pythonArguments } from '../../utils';
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
        return `${kwargs.target} = op.load.csv('${kwargs.url}')`;
      }
      return `${kwargs.buffer}_py = BytesIO(${kwargs.buffer}.to_py()); ${kwargs.target} = op.load.csv(${kwargs.buffer}_py)`;
    },
  }),
  createDataframe: DataframeCreationOperation<{
    data: Record<string, PythonCompatible>;
  }>({
    name: 'createDataframe',
    args: [{ name: 'data' }],
    getCode: function (kwargs: {
      target: string;
      data: Record<string, string>;
    }) {
      const data = pythonArguments({ data: kwargs.data });
      return `${kwargs.target} = op.create.dataframe(${data})`;
    },
  }),
};
