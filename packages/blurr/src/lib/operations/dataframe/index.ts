import type { Cols, NoArgs } from '../../../types/arguments';
import type { ArgsType, OperationCreator } from '../../../types/operation';
import type { Source } from '../../../types/source';
import { BlurrOperation } from '../factory';

function DataframeOperation<
  TA extends ArgsType = ArgsType,
  TR extends OperationCompatible = Source
>(operationCreator: OperationCreator) {
  return BlurrOperation<TA, TR>({
    ...operationCreator,
    sourceType: 'dataframe',
  });
}

export const operations = {
  columnsSample: DataframeOperation<
    NoArgs,
    { columns: { title: string }[]; value: PythonCompatible[] }
  >({
    name: 'columnsSample',
    targetType: 'value',
  }),
  getMeta: DataframeOperation<{ spec: string }, string | undefined>({
    name: 'getMeta',
    targetType: 'value',
    args: [
      {
        name: 'spec',
      },
    ],
    getCode: function (kwargs: { source: string; spec: string }) {
      return `Meta.get(${kwargs.source}.meta, "${kwargs.spec}")`;
    },
  }),
  saveCsv: DataframeOperation<NoArgs, ArrayBuffer>({
    name: 'saveCsv',
    targetType: 'value',
    getCode: function (kwargs: { source: string }) {
      return `save_csv(${kwargs.source})`;
    },
  }),
  iloc: DataframeOperation<{ lower_bound: number; upper_bound: number }>({
    name: 'iloc',
    targetType: 'dataframe',
    args: [{ name: 'lower_bound' }, { name: 'upper_bound' }],
  }),
  copy: DataframeOperation<NoArgs>({
    name: 'copy',
    targetType: 'dataframe',
    createsNew: true,
  }),
  profile: DataframeOperation<
    { cols: Cols; bins: number; flush: boolean },
    {
      columns: Record<string, PythonCompatible>;
      summary: Record<string, PythonCompatible>;
      name?: string;
      file_name?: string;
    }
  >({
    targetType: 'value',
    name: 'profile',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'bins',
        default: 10,
      },
      {
        name: 'flush',
        default: false,
      },
    ],
  }),
};
