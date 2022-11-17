import { Source } from '../../../types/source';
import { BlurrOperation } from '../factory';

export const operations = {
  readCsv: BlurrOperation<
    { target?: string; url?: string; buffer?: string },
    Source
  >({
    sourceType: 'none',
    targetType: 'dataframe',
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
};
