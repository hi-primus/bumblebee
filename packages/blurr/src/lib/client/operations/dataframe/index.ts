import type {
  CallbackFunction,
  Cols,
  NoArgs,
  Source
} from '../../../../types/arguments';
import { ArgsType, OperationCreator } from '../../../../types/operation';
import { pythonArguments } from '../../../utils';
import { BlurrOperation } from '../factory';

function DataframeOperation<TA extends ArgsType = ArgsType,
  TR extends OperationCompatible = OperationCompatible>(operationCreator: OperationCreator) {
  return BlurrOperation<TA, TR>({
    ...operationCreator,
    sourceType: 'dataframe'
  });
}

export const operations = {
  append: DataframeOperation<{ dfs: Source[]; buckets: number }>({
    targetType: 'dataframe',
    name: 'cols.append',
    args: [
      {
        name: 'dfs',
        required: true
      }
    ]
  }),
  concat: DataframeOperation<{ dfs: Source[] }>({
    targetType: 'dataframe',
    name: 'cols.concat',
    args: [
      {
        name: 'dfs',
        required: true
      }
    ]
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
        name: 'dfs'
      },
      {
        name: 'how',
        default: 'left'
      },
      {
        name: 'on',
        default: null
      },
      {
        name: 'left_on',
        default: null
      },
      {
        name: 'right_on',
        default: null
      },
      {
        name: 'key_middle',
        default: false
      }
    ]
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
        default: '*'
      },
      {
        name: 'outputCols',
        default: null
      }
    ]
  }),
  drop: DataframeOperation<{ cols: Cols; regex: string; data_type: string }>({
    targetType: 'dataframe',
    name: 'cols.drop',
    args: [
      {
        name: 'cols',
        default: '*'
      },
      {
        name: 'regex',
        default: null
      },
      {
        name: 'data_type',
        default: null
      }
    ]
  }),
  keep: DataframeOperation<{ cols: Cols; regex: string }>({
    targetType: 'dataframe',
    name: 'cols.keep',
    args: [
      {
        name: 'cols',
        default: '*'
      },
      {
        name: 'regex',
        default: null
      }
    ]
  }),
  toTimeStamp: DataframeOperation<{ cols: Cols; format: string }>({
    targetType: 'dataframe',
    name: 'cols.toTimeStamp',
    args: [
      {
        name: 'cols',
        default: '*'
      },
      {
        name: 'format',
        default: null
      }
    ]
  }),
  toList: DataframeOperation<{ cols: Cols }>({
    targetType: 'value',
    name: 'cols.toList',
    args: [
      {
        name: 'cols',
        default: '*'
      }
    ]
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
        default: '*'
      },
      {
        name: 'valueFunc',
        default: null
      },
      {
        name: 'where',
        default: null
      },
      {
        name: 'args',
        default: null
      },
      {
        name: 'default',
        default: null
      },
      {
        name: 'evalValue',
        default: false
      },
      {
        name: 'each',
        default: true
      }
    ]
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
        default: '*'
      },
      {
        name: 'outputCols',
        default: null
      }
    ]
  }),
  parseInferredTypes: DataframeOperation<{ colDataType }>({
    targetType: 'value',
    name: 'cols.parseInferredTypes',
    args: [
      {
        name: 'colDataType'
      }
    ]
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
        default: '*'
      },
      {
        name: 'useInternal'
      },
      {
        name: 'calculate'
      },
      {
        name: 'tidy',
        default: true
      }
    ]
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
        default: '*'
      },
      {
        name: 'dataTypes',
        default: null
      },
      {
        name: 'inferred',
        default: false
      }
    ]
  }),
  unSetDateType: DataframeOperation<{ cols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.unSetDateType',
    args: [
      {
        name: 'cols',
        default: '*'
      }]
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
  cast: DataframeOperation<{ cols: Cols, dataType: string, outputCols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.cast',
    args: [
      {
        name: 'cols',
        default: '*'
      },
      {
        name: 'dataType',
        default: null
      },
      {
        name: 'outputCols',
        default: null
      }]
  }),
  profile: DataframeOperation<{ cols: Cols, bins: number, flush: boolean }>({
    targetType: 'value',
    name: 'cols.profile',
    args: [
      {
        name: 'cols',
        default: '*'
      },
      {
        name: 'bins',
        default: 10
      },
      {
        name: 'flush',
        default: false
      }]
  }),
  pattern: DataframeOperation<{ cols: Cols, outputCols: Cols, mode: number }>({
    targetType: 'dataframe',
    name: 'cols.pattern',
    args: [
      {
        name: 'cols',
        default: '*'
      },
      {
        name: 'outputCols',
        default: null
      },
      {
        name: 'mode',
        default: 0
      }]
  }),
  assign: DataframeOperation<{ cols: Cols, value: anys }>({
    targetType: 'dataframe',
    name: 'cols.assign',
    args: [
      {
        name: 'cols',
        default: '*'
      },
      {
        name: 'value',
        default: null
      }]
  }),
  correlation: DataframeOperation<{ cols: Cols, method: string, compute: boolean, tidy: boolean }>({
    targetType: 'dataframe',
    name: 'cols.correlation',
    args: [
      {
        name: 'cols',
        default: '*'
      },
      {
        name: 'method',
        default: 'pearson'
      },
      {
        name: 'compute',
        default: true
      },
      {
        name: 'tidy',
        default: true
      }]
  }),
  crossTab: DataframeOperation<{ colX: Cols, colY: Cols, output: string, compute }>({
    targetType: 'dataframe',
    name: 'cols.crossTab',
    args: [
      {
        name: 'colX'
      },
      {
        name: 'colY'
      },
      {
        name: 'output'
      },
      {
        name: 'compute',
        default: true
      }]
  }),
  patternCounts: DataframeOperation<{ cols: Cols, n: number, mode: number, flush: boolean }>({
    targetType: 'dataframe',
    name: 'cols.patternCounts',
    args: [
      {
        name: 'cols',
        default: '*'
      },
      {
        name: 'n',
        default: 10
      },
      {
        name: 'mode',
        default: 0
      },
      {
        name: 'flush',
        default: false
      }]
  }),
  groupBy: DataframeOperation<{ by: Cols, agg: string }>({
    targetType: 'dataframe',
    name: 'cols.groupBy',
    args: [
      {
        name: 'by'
      },
      {
        name: 'agg'
      }
    ]
  }),
  move: DataframeOperation<{ cols: Cols, position: string, refCol: string }>({
    targetType: 'dataframe',
    name: 'cols.move',
    args: [
      {
        name: 'cols',
        default: '*'
      },
      {
        name: 'position',
        default: 'after'
      },
      {
        name: 'refCol',
        default: null
      }]
  }),
  sort: DataframeOperation<{ order: string, cols: Cols }>({
    targetType: 'dataframe',
    name: 'cols.sort',
    args: [
      {
        name: 'order',
        default: 'ascending'
      },
      {
        name: 'cols'
      }]
  }),
  dataType: DataframeOperation<{ cols: Cols, names: string, tidy: boolean }>({
    targetType: 'value',
    name: 'cols.dataType',
    args: [
      {
        name: 'cols'
      },
      {
        name: 'names',
        default: false
      },
      {
        name: 'tidy',
        default: true
      }]
  }),
  schemaDataType: DataframeOperation<{ cols: Cols, tidy: boolean }>({
    targetType: 'value',
    name: 'cols.schemaDataType',
    args: [
      {
        name: 'cols',
        default: '*'
      },
      {
        name: 'tidy',
        default: true
      }]
  }),
  // TODO: Should we agg_exp expression
  // TODO: Should we exec_agg expression
  // TODO: Should we format_agg expression
  //TODO: where to put constants like RELATIVE_ERROR
  mad: DataframeOperation<{ cols: Cols, relativeError: boolean, more: boolean, estimate: boolean, compute: boolean, tidy: boolean }>({
    targetType: 'value',
    name: 'cols.mad',
    args: [
      {
        name: 'cols',
        default: '*'
      },
      {
        name: 'relativeError',
        default: 10000
      }]

  }),
  min: DataframeOperation<{ cols: Cols, numeric: boolean, tidy: boolean, compute: boolean }>({
    targetType: 'value',
    name: 'cols.min',
    args: [
      {
        name: 'cols',
        default: '*'
      },
      {
        name: 'numeric',
        default: null
      },
      {
        name: 'tidy',
        default: true
      },
      {
        name: 'compute',
        default: true
      }]
  }),
  max: DataframeOperation<{ cols: Cols, numeric: boolean, tidy: boolean, compute: boolean }>({
    targetType: 'value',
    name: 'cols.max',
    args: [
      {
        name: 'cols',
        default: '*'
      },
      {
        name: 'numeric',
        default: null
      },
      {
        name: 'tidy',
        default: true
      },
      {
        name: 'compute',
        default: true
      }]
  }),
  mode: DataframeOperation<{ cols: Cols, tidy: boolean, compute: boolean }>({
    targetType: 'value',
    name: 'cols.mode',
    args: [
      {
        name: 'cols',
        default: '*'
      },
      {
        name: 'tidy',
        default: true
      },
      {
        name: 'compute',
        default: true
      }]
  }),
  range: DataframeOperation<{ cols: Cols, tidy: boolean, compute: boolean }>({
    targetType: 'value',
    name: 'cols.range',
    args: [
      {
        name: 'cols',
        default: '*'
      },
      {
        name: 'tidy',
        default: true
      },
      {
        name: 'compute',
        default: true
      }]
  }),
  percentile: DataframeOperation<{ cols: Cols, values: number, relativeError: number, estimate: boolean, tidy: boolean, compute: boolean }>({
    targetType: 'value',
    name: 'cols.percentile',
    args: [
      {
        name: 'cols',
        default: '*'
      },
      {
        name: 'values',
        default: null
      },
      {
        name: 'relativeError',
        default: 10000
      },
      {
        name: 'estimate',
        default: true
      },
      {
        name: 'tidy',
        default: true
      }]

  }),
  median: DataframeOperation<{ cols: Cols, relativeError: number, tidy: boolean, compute: boolean }>({
    targetType: 'value',
    name: 'cols.median',
    args: [
      {
        name: 'cols',
        default: '*'
      },
      {
        name: 'relativeError',
        default: 10000
      },
      {
        name: 'tidy',
        default: true

      },
      {
        name: 'compute',
        default: true
      }]
  }),
  kurtosis: DataframeOperation<{ cols: Cols, tidy: boolean, compute: boolean }>({
    targetType: 'value',
    name: 'cols.kurtosis',
    args: [
      {
        name: 'cols',
        default: '*'
      },
      {
        name: 'tidy',
        default: true
      },
      {
        name: 'compute',
        default: true
      }
    ]
  }),
  skew: DataframeOperation<{ cols: Cols, tidy: boolean, compute: boolean }>({
      targetType: 'value',
      name: 'cols.skew',
      args: [
        {
          name: 'cols',
          default: '*'
        },
        {
          name: 'tidy',
          default: true
        },
        {
          name: 'compute',
          default: true
        }
      ]
    }
  ),
  mean: DataframeOperation<{ cols: Cols, tidy: boolean, compute: boolean }>({
    targetType: 'value',
    name: 'cols.mean',
    args: [
      {
        name: 'cols',
        default: '*'
      },
      {
        name: 'tidy',
        default: true
      },
      {
        name: 'compute',
        default: true
      }]
  }),
  sum: DataframeOperation<{ cols: Cols, tidy: boolean, compute: boolean }>({
      targetType: 'value',
      name: 'cols.sum',
      args: [
        {
          name: 'cols',
          default: '*'
        },
        {
          name: 'tidy',
          default: true
        },
        {
          name: 'compute',
          default: true
        }]

    }
  ),
  prod: DataframeOperation<{ cols: Cols, tidy: boolean, compute: boolean }>({
    targetType: 'value',
    name: 'cols.prod',
    args: [
      {
        name: 'cols',
        default: '*'
      },
      {
        name: 'tidy',
        default: true
      },
      {
        name: 'compute',
        default: true
      }]
  }),
  cumSum: DataframeOperation<{ cols: Cols, outputCols: Cols }>({
      targetType: 'dataframe',
      name: 'cols.cumSum',
      args: [
        {
          name: 'cols',
          default: '*'
        },
        {
          name: 'outputCols',
          default: null
        }]
    }
  ),
  cumProd: DataframeOperation<{ cols: Cols, outputCols: Cols }>({
      targetType: 'dataframe',
      name: 'cols.cumProd',
      args: [
        {
          name: 'cols',
          default: '*'
        },
        {
          name: 'outputCols',
          default: null
        }]
    }
  ),
  cumMax: DataframeOperation<{ cols: Cols, outputCols: Cols }>({
      targetType: 'dataframe',
      name: 'cols.cumMax',
      args: [
        {
          name: 'cols',
          default: '*'
        },
        {
          name: 'outputCols',
          default: null
        }]
    }
  ),
  cumMin: DataframeOperation<{ cols: Cols, outputCols: Cols }>({
      targetType: 'dataframe',
      name: 'cols.cumMin',
      args: [
        {
          name: 'cols',
          default: '*'
        },
        {
          name: 'outputCols',
          default: null
        }]
    }
  ),
  variance: DataframeOperation<{ cols: Cols, tidy: boolean, compute: boolean }>({
      targetType: 'value',
      name: 'cols.var',
      args: [
        {
          name: 'cols',
          default: '*'
        },
        {
          name: 'tidy',
          default: true

        },
        {
          name: 'compute',
          default: true
        }
      ]
    }
  ),
  std: DataframeOperation<{ cols: Cols, tidy: boolean, compute: boolean }>({
      targetType: 'value',
      name: 'cols.std',
      args: [
        {
          name: 'cols',
          default: '*'
        },
        {
          name: 'tidy',
          default: true

        },
        {
          name: 'compute',
          default: true
        }
      ]
    }
  ),

  frequency: DataframeOperation<{ cols: Cols }>({
    targetType: 'value' as const,
    name: 'cols.frequency',
    getCode: function(kwargs: { source: string; cols: Cols }) {
      kwargs = Object.assign({ cols: '*' }, kwargs);
      return `${kwargs.source}.cols.frequency(${pythonArguments(kwargs)})`;
    }
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
        default: '*'
      },
      {
        name: 'buckets',
        default: 10
      }
    ]
  }),
  count: DataframeOperation<NoArgs, number>({
    name: 'count',
    getCode: function(kwargs: { source: string }) {
      return `${kwargs.source}.rows.count()`;
    }
  }),
  columns: DataframeOperation<NoArgs, string[]>({
    name: 'cols.names'
  }),
  columnsSample: DataframeOperation<{ start: number; stop: number }>({
    targetType: 'value',
    name: 'columnsSample',
    args: {
      start: 0,
      stop: 10
    },
    getCode: function(kwargs) {
      return (
        `${kwargs.source}[${kwargs.start}: ${kwargs.stop}]` +
        `.columns_sample("*")`
      );
    }
  })
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
