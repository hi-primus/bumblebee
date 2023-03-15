import type {
  Cols,
  FunctionArgument,
  NoArgs,
  SearchBy,
  SourceArg,
} from '../../../../types/arguments';
import type { ArgsType, OperationCreator } from '../../../../types/operation';
import type { Source } from '../../../../types/source';
import { RELATIVE_ERROR } from '../../../utils';
import { BlurrOperation } from '../../factory';

import { operations as maskOperations } from './mask';

function DataframeOperation<
  TA extends ArgsType = ArgsType,
  TR extends OperationCompatible = Source
>(operationCreator: OperationCreator) {
  return BlurrOperation<TA, TR>({
    ...operationCreator,
    sourceType: 'dataframe',
  });
}

function AggregationOperation<TA extends ArgsType = NoArgs>(
  operationCreator: Pick<OperationCreator, 'name' | 'args'>
) {
  type Args = { cols: Cols } & TA & { tidy: boolean; compute: boolean };

  operationCreator = Object.assign({ args: [] }, operationCreator);

  return DataframeOperation<Args, PythonCompatible>({
    targetType: 'value',
    name: operationCreator.name,
    args: [
      {
        name: 'cols',
        default: '*',
      },
      ...operationCreator.args,
      {
        name: 'tidy',
        default: true,
      },
      {
        name: 'compute',
        default: true,
      },
    ],
  });
}

function DateDataframeOperation(name: string) {
  return DataframeOperation<{ cols: Cols; outputCols: Cols }>({
    targetType: 'dataframe',
    name,
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'value',
        default: null,
      },
      {
        name: 'dateFormat',
        default: null,
      },
      {
        name: 'round',
        default: null,
      },
      {
        name: 'outputCols',
        default: null,
      },
      {
        name: 'func',
        default: null,
      },
    ],
  });
}

function StandardDataframeOperation(name: string) {
  return DataframeOperation<{ cols: Cols; outputCols: Cols }>({
    targetType: 'dataframe',
    name,
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
  });
}

function ColsMathOperation(name: string) {
  return DataframeOperation<{ cols: Cols; outputCols: Cols }>({
    targetType: 'dataframe',
    name,
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
  });
}

export const operations = {
  ...maskOperations,
  append: DataframeOperation<{ dfs: SourceArg[]; buckets: number }, Source>({
    targetType: 'dataframe',
    name: 'cols.append',
    args: [
      {
        name: 'dfs',
        required: true,
      },
    ],
  }),
  concat: DataframeOperation<{ dfs: SourceArg[] }>({
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
    dfs: SourceArg[];
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
  select: DataframeOperation<{ cols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.select',
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
        name: 'dataType',
        default: null,
      },
      {
        name: 'invert',
        default: false,
      },
      {
        name: 'acceptsMissingCols',
        default: false,
      },
    ],
  }),
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
    valueFunc: FunctionArgument | PythonCompatible;
    where: string;
    args: PythonCompatible[];
    default: PythonCompatible;
    evalValue: boolean;
    each: boolean;
    evalVariables: Record<string, PythonCompatible>;
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
      {
        name: 'evalVariables',
        default: null,
      },
    ],
  }),
  // TODO: Support functions
  rename: DataframeOperation<{
    cols: Cols;
    names: Cols;
    func: FunctionArgument;
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
        // TODO: use argName to override python argument name
        // name: 'names',
        // argName: 'output_cols',
        default: null,
      },
      {
        name: 'func',
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
  unSetDateType: DataframeOperation<{ cols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.unSetDateType',
    args: [
      {
        name: 'cols',
        default: '*',
      },
    ],
  }),
  // TODO: implement set_date_format and unset_date_format
  // setDateFormat: DataframeOperation<{ cols: Cols, format: string }>({
  //   targetType: 'dataframe',
  //   name: 'cols.setDateFormat',
  //   args: [
  //     {
  //       name: 'cols',
  //       default: '*'
  //     }]
  // }),
  cast: DataframeOperation<{ cols: Cols; dataType: string; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.cast',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'dataType',
        default: null,
      },
      {
        name: 'outputCols',
        default: null,
      },
    ],
  }),
  profile: DataframeOperation<{ cols: Cols; bins: number; flush: boolean }>({
    targetType: 'value',
    name: 'cols.profile',
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
  pattern: DataframeOperation<{ cols: Cols; outputCols: Cols; mode: number }>({
    targetType: 'dataframe',
    name: 'cols.pattern',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'outputCols',
        default: null,
      },
      {
        name: 'mode',
        default: 0,
      },
    ],
  }),
  assign: DataframeOperation<{
    cols: Cols;
    value;
    [k: string]: PythonCompatible;
  }>({
    targetType: 'dataframe',
    name: 'cols.assign',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'value',
        default: null,
      },
    ],
  }),
  correlation: AggregationOperation<{
    method: string;
  }>({
    name: 'cols.correlation',
    args: [
      {
        name: 'method',
        default: 'pearson',
      },
    ],
  }),
  crossTab: DataframeOperation<{
    colX: Cols;
    colY: Cols;
    output: string;
    compute;
  }>({
    targetType: 'dataframe',
    name: 'cols.crossTab',
    args: [
      {
        name: 'colX',
      },
      {
        name: 'colY',
      },
      {
        name: 'output',
      },
      {
        name: 'compute',
        default: true,
      },
    ],
  }),
  patternCounts: DataframeOperation<{
    cols: Cols;
    n: number;
    mode: number;
    flush: boolean;
  }>({
    targetType: 'dataframe',
    name: 'cols.patternCounts',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'n',
        default: 10,
      },
      {
        name: 'mode',
        default: 0,
      },
      {
        name: 'flush',
        default: false,
      },
    ],
  }),
  groupBy: DataframeOperation<{ by: Cols; agg: string }>({
    targetType: 'dataframe',
    name: 'cols.groupBy',
    args: [
      {
        name: 'by',
      },
      {
        name: 'agg',
      },
    ],
  }),
  move: DataframeOperation<{
    column: Cols;
    position: string | number;
    refCol: string;
  }>({
    targetType: 'dataframe',
    name: 'cols.move',
    args: [
      {
        name: 'column', // 'col' TODO: fix name != argName
        argName: 'column',
        default: '*',
      },
      {
        name: 'position',
        default: 'after',
      },
      {
        name: 'refCol',
        default: null,
      },
    ],
  }),
  sort: DataframeOperation<{ order: string; cols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.sort',
    args: [
      {
        name: 'order',
        default: 'ascending',
      },
      {
        name: 'cols',
      },
    ],
  }),
  dataType: DataframeOperation<{ cols: Cols; names: string; tidy: boolean }>({
    targetType: 'value',
    name: 'cols.dataType',
    args: [
      {
        name: 'cols',
      },
      {
        name: 'names',
        default: false,
      },
      {
        name: 'tidy',
        default: true,
      },
    ],
  }),
  schemaDataType: DataframeOperation<{ cols: Cols; tidy: boolean }>({
    targetType: 'value',
    name: 'cols.schemaDataType',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'tidy',
        default: true,
      },
    ],
  }),

  mad: AggregationOperation<{
    relativeError: boolean;
    more: boolean;
    estimate: boolean;
  }>({
    name: 'cols.mad',
    args: [
      {
        name: 'relativeError',
        default: RELATIVE_ERROR,
      },
    ],
  }),
  min: AggregationOperation<{ numeric: boolean }>({
    name: 'cols.min',
    args: [
      {
        name: 'numeric',
        default: null,
      },
    ],
  }),
  max: AggregationOperation<{ numeric: boolean }>({
    name: 'cols.max',
    args: [
      {
        name: 'numeric',
        default: null,
      },
    ],
  }),
  mode: AggregationOperation({
    name: 'cols.mode',
  }),
  range: AggregationOperation({
    name: 'cols.range',
  }),
  percentile: AggregationOperation<{
    values: number;
    relativeError: number;
    estimate: boolean;
  }>({
    name: 'cols.percentile',
    args: [
      {
        name: 'values',
        default: null,
      },
      {
        name: 'relativeError',
        default: RELATIVE_ERROR,
      },
      {
        name: 'estimate',
        default: true,
      },
    ],
  }),
  median: AggregationOperation<{
    relativeError: number;
  }>({
    name: 'cols.median',
    args: [
      {
        name: 'relativeError',
        default: RELATIVE_ERROR,
      },
    ],
  }),
  kurtosis: AggregationOperation({
    name: 'cols.kurtosis',
  }),
  skew: AggregationOperation({
    name: 'cols.skew',
  }),
  mean: AggregationOperation({
    name: 'cols.mean',
  }),
  sum: AggregationOperation({
    name: 'cols.sum',
  }),
  prod: AggregationOperation({
    name: 'cols.prod',
  }),
  cumSum: DataframeOperation<{ cols: Cols; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.cumSum',
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
  cumProd: DataframeOperation<{ cols: Cols; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.cumProd',
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
  cumMax: DataframeOperation<{ cols: Cols; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.cumMax',
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
  cumMin: DataframeOperation<{ cols: Cols; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.cumMin',
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
  variance: AggregationOperation({
    name: 'cols.var',
  }),
  std: AggregationOperation({
    name: 'cols.std',
  }),
  dateFormat: DataframeOperation<{
    cols: Cols;
    tidy: boolean;
    compute: boolean;
    cached: boolean;
    [k: string]: PythonCompatible;
  }>({
    targetType: 'dataframe',
    name: 'cols.dateFormat',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'tidy',
        default: true,
      },
      {
        name: 'compute',
        default: true,
      },
      {
        name: 'cached',
        default: null,
      },
    ],
  }),
  item: DataframeOperation<{ col: Cols; index: number; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.item',
    args: [
      {
        name: 'col',
        default: '*',
      },
      {
        name: 'index',
        default: 0,
      },
      {
        name: 'outputCols',
        default: null,
      },
    ],
  }),
  get: DataframeOperation<{ col: Cols; keys: number; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.get',
    args: [
      {
        name: 'col',
        default: '*',
      },
      {
        name: 'keys',
        default: null,
      },
      {
        name: 'outputCols',
        default: null,
      },
    ],
  }),
  abs: DataframeOperation<{ cols: Cols; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.abs',
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
  exp: DataframeOperation<{ cols: Cols; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.exp',
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
  log: DataframeOperation<{ cols: Cols; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.log',
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
  ln: DataframeOperation<{ cols: Cols; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.ln',
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
  pow: DataframeOperation<{ cols: Cols; outputCols: Cols; power: number }>({
    targetType: 'dataframe',
    name: 'cols.pow',
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
  sqrt: DataframeOperation<{ cols: Cols; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.sqrt',
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
  reciprocal: DataframeOperation<{ cols: Cols; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.reciprocal',
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
  round: DataframeOperation<{ cols: Cols; outputCols: Cols; decimals: number }>(
    {
      targetType: 'dataframe',
      name: 'cols.round',
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
    }
  ),
  floor: DataframeOperation<{ cols: Cols; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.floor',
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
  ceil: DataframeOperation<{ cols: Cols; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.ceil',
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
  sin: StandardDataframeOperation('cols.sin'),
  cos: StandardDataframeOperation('cols.cos'),
  tan: StandardDataframeOperation('cols.tan'),
  asin: StandardDataframeOperation('cols.asin'),
  acos: StandardDataframeOperation('cols.acos'),
  atan: StandardDataframeOperation('cols.atan'),
  sinh: StandardDataframeOperation('cols.sinh'),
  cosh: StandardDataframeOperation('cols.cosh'),
  tanh: StandardDataframeOperation('cols.tanh'),
  asinh: StandardDataframeOperation('cols.asinh'),
  acosh: StandardDataframeOperation('cols.acosh'),
  atanh: StandardDataframeOperation('cols.atanh'),
  substring: DataframeOperation<{
    cols: Cols;
    start: number;
    end: number;
    outputCols: Cols;
  }>({
    targetType: 'dataframe',
    name: 'cols.substring',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'start',
        default: null,
      },
      {
        name: 'end',
        default: null,
      },
      {
        name: 'outputCols',
        default: null,
      },
    ],
  }),
  extract: DataframeOperation<{ cols: Cols; regex: string; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.extract',
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
        name: 'outputCols',
        default: null,
      },
    ],
  }),
  slice: DataframeOperation<{
    cols: Cols;
    start: number;
    stop: number;
    step: number;
    outputCols: Cols;
  }>({
    targetType: 'dataframe',
    name: 'cols.slice',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'start',
        default: null,
      },
      {
        name: 'stop',
        default: null,
      },
      {
        name: 'step',
        default: null,
      },
      {
        name: 'outputCols',
        default: null,
      },
    ],
  }),
  left: DataframeOperation<{ cols: Cols; n: number; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.left',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'n',
        default: null,
      },
      {
        name: 'outputCols',
        default: null,
      },
    ],
  }),
  right: DataframeOperation<{ cols: Cols; n: number; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.right',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'n',
        default: null,
      },
      {
        name: 'outputCols',
        default: null,
      },
    ],
  }),
  mid: DataframeOperation<{
    cols: Cols;
    start: number;
    end: number;
    n: number;
    outputCols: Cols;
  }>({
    targetType: 'dataframe',
    name: 'cols.mid',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'start',
        default: 0,
      },
      {
        name: 'end',
        default: null,
      },
      {
        name: 'n',
        default: null,
      },
      {
        name: 'outputCols',
        default: null,
      },
    ],
  }),
  toFloat: DataframeOperation<{ cols: Cols; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.toFloat',
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
  toNumeric: DataframeOperation<{ cols: Cols; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.toNumeric',
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
  toInteger: DataframeOperation<{ cols: Cols; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.toInteger',
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

  toBoolean: DataframeOperation<{ cols: Cols; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.toBoolean',
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
  toString: DataframeOperation<{ cols: Cols; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.toString',
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
  dateFormats: DataframeOperation<{ cols: Cols; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.dateFormats',
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
  sample: DataframeOperation<{ cols: Cols; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.sample',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'n',
        default: 10,
      },
      {
        name: 'seed',
        default: 0,
      },
      {
        name: 'outputCols',
        default: null,
      },
    ],
  }),

  lower: StandardDataframeOperation('cols.lower'),
  upper: StandardDataframeOperation('cols.upper'),
  title: StandardDataframeOperation('cols.title'),
  capitalize: StandardDataframeOperation('cols.capitalize'),
  pad: DataframeOperation<{
    cols: Cols;
    width: number;
    fillChar: string;
    side: 'left' | 'right' | 'both';
    outputCols: Cols;
  }>({
    targetType: 'dataframe',
    name: 'cols.pad',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'width',
        default: 0,
      },
      {
        name: 'side',
        default: 'left',
      },
      {
        name: 'fillChar',
        default: ' ',
      },
      {
        name: 'outputCols',
        default: null,
      },
    ],
  }),
  trim: DataframeOperation<{
    cols: Cols;
    outputCols;
  }>({
    targetType: 'dataframe',
    name: 'cols.trim',
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
  strip: DataframeOperation<{
    cols: Cols;
    chars: string;
    side: string;
    outputCols: Cols;
  }>({
    targetType: 'dataframe',
    name: 'cols.strip',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'chars',
        default: null,
      },
      {
        name: 'side',
        default: 'left',
      },
      {
        name: 'outputCols',
        default: null,
      },
    ],
  }),
  strip_html: DataframeOperation<{ cols: Cols; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.strip_html',
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
  formatDate: DataframeOperation<{
    cols: Cols;
    currentFormat: string;
    outputFormat: string;
    outputCols: Cols;
  }>({
    targetType: 'dataframe',
    name: 'cols.formatDate',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'currentFormat',
        default: null,
      },
      {
        name: 'outputFormat',
        default: null,
      },
      {
        name: 'outputCols',
        default: null,
      },
    ],
  }),
  wordTokenize: DataframeOperation<{ cols: Cols; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.wordTokenize',
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
  wordCount: DataframeOperation<{ cols: Cols; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.wordCount',
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
  len: DataframeOperation<{ cols: Cols; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.len',
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
  expandContractedWords: DataframeOperation<{ cols: Cols; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.expandContractedWords',
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
  reverse: DataframeOperation<{ cols: Cols; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.reverse',
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
  remove: DataframeOperation<{
    cols: Cols;
    search: string;
    searchBy: SearchBy;
    outputCols: Cols;
  }>({
    targetType: 'dataframe',
    name: 'cols.remove',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'search',
        default: null,
      },
      {
        name: 'searchBy',
        default: 'word',
      },
      {
        name: 'outputCols',
        default: null,
      },
    ],
  }),
  normalizeChars: DataframeOperation<{ cols: Cols; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.normalizeChars',
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
  removeNumbers: DataframeOperation<{ cols: Cols; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.removeNumbers',
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
  removeWhiteSpaces: DataframeOperation<{ cols: Cols; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.removeWhiteSpaces',
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
  removeStopWords: DataframeOperation<{
    cols: Cols;
    language: string;
    outputCols: Cols;
  }>({
    targetType: 'dataframe',
    name: 'cols.removeStopWords',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'language',
        default: 'english',
      },
      {
        name: 'outputCols',
        default: null,
      },
    ],
  }),
  removeURLS: DataframeOperation<{ cols: Cols; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.removeURLS',
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
  normalizeSpaces: DataframeOperation<{ cols: Cols; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.normalizeSpaces',
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
  removeSpecialChars: DataframeOperation<{ cols: Cols; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.removeSpecialChars',
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
  toDateTime: DataframeOperation<{
    cols: Cols;
    currentFormat: string;
    outputCols: Cols;
    outputFormat: string;
  }>({
    targetType: 'dataframe',
    name: 'cols.toDateTime',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'currentFormat',
        default: null,
      },
      {
        name: 'outputCols',
        default: null,
      },
      {
        name: 'outputFormat',
        default: null,
      },
    ],
  }),
  year: DataframeOperation<{ cols: Cols; format: string; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.year',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'format',
        default: null,
      },
      {
        name: 'outputCols',
        default: null,
      },
    ],
  }),
  month: DataframeOperation<{ cols: Cols; format: string; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.month',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'format',
        default: null,
      },
      {
        name: 'outputCols',
        default: null,
      },
    ],
  }),
  day: DataframeOperation<{ cols: Cols; format: string; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.day',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'format',
        default: null,
      },
      {
        name: 'outputCols',
        default: null,
      },
    ],
  }),
  hour: DataframeOperation<{ cols: Cols; format: string; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.hour',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'format',
        default: null,
      },
      {
        name: 'outputCols',
        default: null,
      },
    ],
  }),
  minute: DataframeOperation<{ cols: Cols; format: string; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.minute',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'format',
        default: null,
      },
      {
        name: 'outputCols',
        default: null,
      },
    ],
  }),
  second: DataframeOperation<{ cols: Cols; format: string; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.second',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'format',
        default: null,
      },
      {
        name: 'outputCols',
        default: null,
      },
    ],
  }),
  weekday: DataframeOperation<{ cols: Cols; format: string; outputCols: Cols }>(
    {
      targetType: 'dataframe',
      name: 'cols.weekday',
      args: [
        {
          name: 'cols',
          default: '*',
        },
        {
          name: 'format',
          default: null,
        },
        {
          name: 'outputCols',
          default: null,
        },
      ],
    }
  ),
  yearsBetween: DateDataframeOperation('cols.yearsBetween'),
  monthsBetween: DateDataframeOperation('cols.monthsBetween'),
  daysBetween: DateDataframeOperation('cols.daysBetween'),
  hoursBetween: DateDataframeOperation('cols.hoursBetween'),
  minutesBetween: DateDataframeOperation('cols.minutesBetween'),
  secondsBetween: DateDataframeOperation('cols.secondsBetween'),
  timeBetween: DataframeOperation<{
    cols: Cols;
    value;
    dateFormat;
    round;
    outputCols: Cols;
    func;
  }>({
    targetType: 'dataframe',
    name: 'cols.timeBetween',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'value',
        default: null,
      },
      {
        name: 'dateFormat',
        default: null,
      },
      {
        name: 'round',
        default: null,
      },
      {
        name: 'outputCols',
        default: null,
      },
      {
        name: 'func',
        default: null,
      },
    ],
  }),

  replace: DataframeOperation<{
    cols: Cols;
    search: string;
    replaceBy: string;
    searchBy: SearchBy;
    ignoreCase: boolean;
    outputCols: Cols;
  }>({
    targetType: 'dataframe',
    name: 'cols.replace',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'search',
        default: null,
      },
      {
        name: 'replaceBy',
        default: null,
      },
      {
        name: 'searchBy',
        default: null,
      },
      {
        name: 'ignoreCase',
        default: false,
      },
      {
        name: 'outputCols',
        default: null,
      },
    ],
  }),
  replaceRegex: DataframeOperation<{
    cols: Cols;
    search;
    replaceBy: string;
    searchBy: string;
    ignoreCase: boolean;
    outputCols: Cols;
  }>({
    targetType: 'dataframe',
    name: 'cols.replaceRegex',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'search',
        default: null,
      },
      {
        name: 'replaceBy',
        default: null,
      },
      {
        name: 'searchBy',
        default: null,
      },
      {
        name: 'ignoreCase',
        default: false,
      },
      {
        name: 'outputCols',
        default: null,
      },
    ],
  }),
  numToWords: DataframeOperation<{
    cols: Cols;
    language: string;
    outputCols: Cols;
  }>({
    targetType: 'dataframe',
    name: 'cols.numToWords',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'language',
        default: 'en',
      },
      {
        name: 'outputCols',
        default: null,
      },
    ],
  }),
  lemmatizeVerbs: DataframeOperation<{
    cols: Cols;
    language: string;
    outputCols: Cols;
  }>({
    targetType: 'dataframe',
    name: 'cols.lemmatizeVerbs',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'language',
        default: 'en',
      },
      {
        name: 'outputCols',
        default: null,
      },
    ],
  }),
  stemVerbs: DataframeOperation<{ cols: Cols; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.stemVerbs',
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
  impute: DataframeOperation<{
    cols: Cols;
    dataType: string;
    strategy: string;
    fillValue;
    outputCols: Cols;
  }>({
    targetType: 'dataframe',
    name: 'cols.impute',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'dataType',
        default: 'auto',
      },
      {
        name: 'strategy',
        default: 'auto',
      },
      {
        name: 'fillValue',
        default: null,
      },
      {
        name: 'outputCols',
        default: null,
      },
    ],
  }),
  fillNA: DataframeOperation<{
    cols: Cols;
    value;
    outputCols: Cols;
    evalValue;
  }>({
    targetType: 'dataframe',
    name: 'cols.fillNA',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'value',
        default: null,
      },
      {
        name: 'outputCols',
        default: null,
      },
      {
        name: 'evalValue',
        default: false,
      },
    ],
  }),
  count: DataframeOperation<NoArgs, number>({
    targetType: 'value',
    name: 'cols.count',
  }),
  uniqueValues: AggregationOperation<{
    estimate: boolean;
  }>({
    name: 'cols.uniqueValues',
    args: [
      {
        name: 'estimate',
        default: false,
      },
    ],
  }),
  countUniques: AggregationOperation<{
    estimate: boolean;
  }>({
    name: 'cols.countUniques',
    args: [
      {
        name: 'estimate',
        default: false,
      },
    ],
  }),

  add: ColsMathOperation('cols.add'),
  sub: ColsMathOperation('cols.sub'),
  mul: ColsMathOperation('cols.mul'),
  div: ColsMathOperation('cols.div'),
  rdiv: ColsMathOperation('cols.rdiv'),
  zScore: DataframeOperation<{ cols: Cols; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.zScore',
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
  modifiedZScore: DataframeOperation<{
    cols: Cols;
    estimate: boolean;
    outputCols: Cols;
  }>({
    targetType: 'dataframe',
    name: 'cols.modifiedZScore',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'estimate',
        default: true,
      },
      {
        name: 'outputCols',
        default: null,
      },
    ],
  }),
  standardScaler: DataframeOperation<{ cols: Cols; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.standardScaler',
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
  maxAbsScaler: DataframeOperation<{ cols: Cols; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.maxAbsScaler',
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
  minMaxScaler: DataframeOperation<{ cols: Cols; outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.minMaxScaler',
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
  iqr: DataframeOperation<{ cols: Cols; more: boolean; estimate: boolean }>({
    targetType: 'value',
    name: 'cols.iqr',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'more',
        default: false,
      },
      {
        name: 'estimate',
        default: true,
      },
    ],
  }),
  nest: DataframeOperation<{
    cols: Cols;
    outputCol: string;
    drop: boolean;
    shape: string;
  }>({
    targetType: 'dataframe',
    name: 'cols.nest',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'outputCol',
        default: null,
      },
      {
        name: 'drop',
        default: true,
      },
      {
        name: 'shape',
        default: 'string',
      },
    ],
  }),
  unnest: DataframeOperation<{
    cols: Cols;
    separator: string;
    splits: number;
    index: number;
    outputCols: Cols;
    drop: boolean;
    mode: string;
  }>({
    targetType: 'dataframe',
    name: 'cols.unnest',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'separator',
        default: null,
      },
      {
        name: 'splits',
        default: 2,
      },
      {
        name: 'index',
        default: null,
      },
      {
        name: 'outputCols',
        default: null,
      },
      {
        name: 'drop',
        default: false,
      },
      {
        name: 'mode',
        default: 'string',
      },
    ],
  }),
  heatMap: DataframeOperation<{
    colX: Cols;
    colsY: Cols;
    binX: number;
    binY: number;
    compute: boolean;
  }>({
    targetType: 'dataframe',
    name: 'cols.heatMap',
    args: [
      {
        name: 'colX',
        default: '*',
      },
      {
        name: 'colsY',
        default: '*',
      },
      {
        name: 'binX',
        default: 10,
      },
      {
        name: 'binY',
        default: 10,
      },
      {
        name: 'compute',
        default: true,
      },
    ],
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
  quality: DataframeOperation<{ cols: Cols; flush: boolean; compute: boolean }>(
    {
      targetType: 'value',
      name: 'cols.quality',
      args: [
        {
          name: 'cols',
          default: '*',
        },
        {
          name: 'flush',
          default: false,
        },
        {
          name: 'compute',
          default: true,
        },
      ],
    }
  ),
  inferType: DataframeOperation<{
    cols: Cols;
    sampleCount: number;
    tidy: boolean;
  }>({
    targetType: 'dataframe',
    name: 'cols.inferType',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'sampleCount',
        default: null,
      },
      {
        name: 'tidy',
        default: true,
      },
    ],
  }),
  inferDateFormats: DataframeOperation<{
    cols: Cols;
    sample: number;
    tidy: boolean;
  }>({
    targetType: 'dataframe',
    name: 'cols.inferDateFormats',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'sample',
        default: 200,
      },
      {
        name: 'tidy',
        default: true,
      },
    ],
  }),
  frequency: AggregationOperation<{
    top: number;
    percentage: boolean;
    totalRows: boolean;
    countUniques: boolean;
  }>({
    name: 'cols.frequency',
    args: [
      {
        name: 'top',
        default: 10,
      },
      {
        name: 'percentage',
        default: false,
      },
      {
        name: 'totalRows',
        default: null,
      },
      {
        name: 'countUniques',
        default: false,
      },
    ],
  }),
  boxPlot: DataframeOperation<{ cols: Cols }>({
    targetType: 'value',
    name: 'cols.boxPlot',
    args: [
      {
        name: 'cols',
        default: '*',
      },
    ],
  }),
  names: DataframeOperation<
    {
      cols: Cols;
      dataTypes: string;
      invert: boolean;
      isRegex: boolean;
    },
    string[]
  >({
    targetType: 'value',
    name: 'cols.names',
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
        name: 'invert',
        default: false,
      },
      {
        name: 'isRegex',
        default: null,
      },
    ],
  }),
  countZeros: DataframeOperation<{ cols: Cols; tidy: boolean }>({
    targetType: 'value',
    name: 'cols.countZeros',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'tidy',
        default: true,
      },
    ],
  }),
  qcut: DataframeOperation<{ cols: Cols; quantiles: number; outputCol: Cols }>({
    targetType: 'dataframe',
    name: 'cols.qcut',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'quantiles',
        default: null,
      },
      {
        name: 'outputCol',
        default: null,
      },
    ],
  }),
  cut: DataframeOperation<{
    cols: Cols;
    bins: number;
    labels: [] | false;
    default: PythonCompatible;
    outputCol: Cols;
  }>({
    targetType: 'dataframe',
    name: 'cols.cut',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'bins',
        default: null,
      },
      {
        name: 'labels',
        default: null,
      },
      {
        name: 'default',
        default: null,
      },
      {
        name: 'outputCol',
        default: null,
      },
    ],
  }),
  clip: DataframeOperation<{
    cols: Cols;
    lower_bound: number;
    upper_bound: number;
    outputCol: Cols;
  }>({
    targetType: 'dataframe',
    name: 'cols.clip',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'lower_bound',
        default: null,
      },
      {
        name: 'upper_bound',
        default: null,
      },
      {
        name: 'outputCol',
        default: null,
      },
    ],
  }),
  oneHotEncode: DataframeOperation<{
    cols: Cols;
    prefix: string;
    drop: boolean;
    outputCol: Cols;
    [k: string]: PythonCompatible;
  }>({
    targetType: 'dataframe',
    name: 'cols.oneHotEncode',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'prefix',
        default: null,
      },
      {
        name: 'drop',
        default: true,
      },
    ],
  }),
  stringToIndex: DataframeOperation<{ cols: Cols; outputCol: Cols }>({
    targetType: 'dataframe',
    name: 'cols.stringToIndex',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'outputCol',
        default: null,
      },
    ],
  }),

  indexToString: DataframeOperation<{ cols: Cols; outputCol: Cols }>({
    targetType: 'dataframe',
    name: 'cols.indexToString',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'outputCol',
        default: null,
      },
    ],
  }),

  domain: StandardDataframeOperation('cols.domain'),
  topDomain: StandardDataframeOperation('cols.topDomain'),
  subDomain: StandardDataframeOperation('cols.subDomain'),
  urlSchema: StandardDataframeOperation('cols.urlSchema'),
  urlPath: StandardDataframeOperation('cols.urlPath'),
  urlFile: StandardDataframeOperation('cols.urlFile'),
  urlQuery: StandardDataframeOperation('cols.urlQuery'),
  urlFragment: StandardDataframeOperation('cols.urlFragment'),
  host: StandardDataframeOperation('cols.host'),
  port: StandardDataframeOperation('cols.port'),
  emailUsername: StandardDataframeOperation('cols.emailUsername'),
  emailDomain: StandardDataframeOperation('cols.emailDomain'),

  // TODO: handle any and count functions, _values
  fingerprint: StandardDataframeOperation('cols.fingerprint'),
  pos: StandardDataframeOperation('cols.pos'),
  ngrams: DataframeOperation<{ cols: Cols; n: number; outputCol: Cols }>({
    targetType: 'dataframe',
    name: 'cols.ngramFingerprint',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'n',
        default: 2,
      },
      {
        name: 'outputCol',
        default: null,
      },
    ],
  }),
  ngramFingerprint: DataframeOperation<{
    cols: Cols;
    n: number;
    outputCol: Cols;
  }>({
    targetType: 'dataframe',
    name: 'cols.ngramFingerprint',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'n',
        default: 2,
      },
      {
        name: 'outputCol',
        default: null,
      },
    ],
  }),
  metaphone: StandardDataframeOperation('cols.metaphone'),
  levenshtein: DataframeOperation<{
    cols: Cols;
    otherCols: Cols;
    value: PythonCompatible;
    outputCol: Cols;
  }>({
    targetType: 'dataframe',
    name: 'cols.levenshtein',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'otherCols',
        default: null,
      },
      {
        name: 'value',
        default: null,
      },
      {
        name: 'outputCol',
        default: null,
      },
    ],
  }),
  nysiis: StandardDataframeOperation('cols.nysiis'),
  matchRatingEncoder: StandardDataframeOperation('cols.matchRatingEncoder'),
  doubleMetaphone: StandardDataframeOperation('cols.doubleMetaphone'),
  soundex: StandardDataframeOperation('cols.soundex'),
  tfidf: DataframeOperation<{ cols: Cols }>({
    targetType: 'value',
    name: 'cols.tfidf',
    args: [
      {
        name: 'cols',
        default: '*',
      },
    ],
  }),
  bagOfWords: DataframeOperation<{
    cols: Cols;
    analyzer: string;
    ngramRange: [number, number];
  }>({
    targetType: 'value',
    name: 'cols.bagOfWords',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'analyzer',
        default: 'word',
      },
      {
        name: 'ngramRange',
        default: [1, 1],
      },
    ],
  }),
};
