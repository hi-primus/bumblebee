import { Source } from '../../../types/source';

import { operations as dataframeOperations } from './dataframe';
import { BlurrOperation } from './factory';

export const operations = {
  ...dataframeOperations,
  readCsv: BlurrOperation<{ target?: string; url?: string; buffer?: string }, Source>({
    sourceType: 'none',
    targetType: 'dataframe',
    name: 'readCsv',
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
