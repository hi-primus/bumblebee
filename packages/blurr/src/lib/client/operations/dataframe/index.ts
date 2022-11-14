import type {
  CallbackFunction,
  Cols,
  NoArgs,
  Source,
} from '../../../../types/arguments';
import { ArgsType, OperationCreator } from '../../../../types/operation';
import { pythonArguments } from '../../../utils';
import { BlurrOperation } from '../factory';

function DataframeOperation<
  TA extends ArgsType = ArgsType,
  TR extends OperationCompatible = OperationCompatible
>(operationCreator: OperationCreator) {
  return BlurrOperation<TA, TR>({
    ...operationCreator,
    sourceType: 'dataframe',
  });
}

export const operations = {
  append: DataframeOperation<{ dfs: Source[]; buckets: number }>({
    targetType: 'dataframe',
    name: 'cols.append',
    args: [
      {
        name: 'dfs',
        required: true,
      },
    ],
  }),
  concat: DataframeOperation<{ dfs: Source[] }>({
    targetType: 'dataframe',
    name: 'cols.concat',
    args: [
      {
        name: 'dfs',
        required: true,
      },
    ],
  }),
  join: DataframeOperation<{
    dfs: Source[];
    on: string;
    how: string;
    left_on: Cols;
    right_on: Cols;
    key_middle: boolean;
  }>({
    targetType: 'dataframe',
    name: 'cols.join',
    args: [
      {
        name: 'dfs',
      },
      {
        name: 'how',
        default: 'left',
      },
      {
        name: 'on',
        default: null,
      },
      {
        name: 'left_on',
        default: null,
      },
      {
        name: 'right_on',
        default: null,
      },
      {
        name: 'key_middle',
        default: false,
      },
    ],
  }),
  // select: DataframeOperation<{ cols: Cols }>({
  //   targetType: 'dataframe',
  //   name: 'cols.select',
  //   args: [
  //     {
  //       name: 'cols',
  //       default: '*',
  //     },
  //     {
  //       name: 'regex',
  //       default: null,
  //     },
  //     {
  //       name: 'data_type',
  //       default: null,
  //     },
  //     {
  //       name: 'invert',
  //       default: false,
  //     },
  //     {
  //       name: 'accepts_missing_cols',
  //       default: false,
  //     },
  //   ],
  // }),
  copy: DataframeOperation<{ cols: Cols; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.copy',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'outputCols',
        default: null,
      },
    ],
  }),
  drop: DataframeOperation<{ cols: Cols; regex: string; data_type: string }>({
    targetType: 'dataframe',
    name: 'cols.drop',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'regex',
        default: null,
      },
      {
        name: 'data_type',
        default: null,
      },
    ],
  }),
  keep: DataframeOperation<{ cols: Cols; regex: string }>({
    targetType: 'dataframe',
    name: 'cols.keep',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'regex',
        default: null,
      },
    ],
  }),
  toTimeStamp: DataframeOperation<{ cols: Cols; format: string }>({
    targetType: 'dataframe',
    name: 'cols.toTimeStamp',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'format',
        default: null,
      },
    ],
  }),
  toList: DataframeOperation<{ cols: Cols }>({
    targetType: 'value',
    name: 'cols.toList',
    args: [
      {
        name: 'cols',
        default: '*',
      },
    ],
  }),
  // TODO:Support UDF
  set: DataframeOperation<{
    cols: Cols;
    valueFunc: CallbackFunction | PythonCompatible;
    where: string;
    args;
    default;
    evalValue;
    each;
  }>({
    targetType: 'dataframe',
    name: 'cols.set',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'valueFunc',
        default: null,
      },
      {
        name: 'where',
        default: null,
      },
      {
        name: 'args',
        default: null,
      },
      {
        name: 'default',
        default: null,
      },
      {
        name: 'evalValue',
        default: false,
      },
      {
        name: 'each',
        default: true,
      },
    ],
  }),
  // TODO: Support functions
  rename: DataframeOperation<{
    cols: Cols;
    outputCols: Cols;
    func: CallbackFunction;
  }>({
    targetType: 'dataframe',
    name: 'cols.rename',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'outputCols',
        default: null,
      },
    ],
  }),
  parseInferredTypes: DataframeOperation<{ colDataType }>({
    targetType: 'value',
    name: 'cols.parseInferredTypes',
    args: [
      {
        name: 'colDataType',
      },
    ],
  }),
  inferredDataType: DataframeOperation<{
    cols: Cols;
    useInternal: boolean;
    calculate: boolean;
    tidy: boolean;
  }>({
    targetType: 'value',
    name: 'cols.inferred_data_type',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'useInternal',
      },
      {
        name: 'calculate',
      },
      {
        name: 'tidy',
        default: true,
      },
    ],
  }),
  setDataType: DataframeOperation<{
    cols: Cols;
    dataTypes: string;
    inferred: boolean;
  }>({
    targetType: 'dataframe',
    name: 'cols.setDataType',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'dataTypes',
        default: null,
      },
      {
        name: 'inferred',
        default: false,
      },
    ],
  }),
  frequency: DataframeOperation<{ cols: Cols }>({
    targetType: 'value' as const,
    name: 'cols.frequency',
    getCode: function (kwargs: { source: string; cols: Cols }) {
      kwargs = Object.assign({ cols: '*' }, kwargs);
      return `${kwargs.source}.cols.frequency(${pythonArguments(kwargs)})`;
    },
  }),
  histogram: DataframeOperation<{
    cols: Cols;
    buckets: number;
  }>({
    targetType: 'value',
    name: 'cols.hist',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'buckets',
        default: 10,
      },
    ],
  }),
  count: DataframeOperation<NoArgs, number>({
    name: 'count',
    getCode: function (kwargs: { source: string }) {
      return `${kwargs.source}.rows.count()`;
    },
  }),
  columns: DataframeOperation<NoArgs, string[]>({
    name: 'cols.names',
  }),
  columnsSample: DataframeOperation<{ start: number; stop: number }>({
    targetType: 'value',
    name: 'columnsSample',
    args: {
      start: 0,
      stop: 10,
    },
    getCode: function (kwargs) {
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
