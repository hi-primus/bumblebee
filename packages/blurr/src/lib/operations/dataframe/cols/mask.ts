import type { Cols, ColsResult, NoArgs } from '../../../../types/arguments';
import type { ArgsType, OperationCreator } from '../../../../types/operation';
import { BlurrOperation } from '../../factory';

function MaskColsOperation<
  TA extends ArgsType = ArgsType,
  TR extends PythonCompatible = PythonCompatible
>(
  operationCreator: Pick<OperationCreator, 'name' | 'args'>,
  noCols = false,
  noInverse = false
) {
  type Args = { cols: Cols } & TA & {
      inverse: boolean;
      tidy: boolean;
      compute: boolean;
    };

  operationCreator = Object.assign({ args: [] }, operationCreator);

  const args1 = noCols
    ? []
    : [
        {
          name: 'cols',
          default: '*',
        },
      ];

  const args2 = [
    ...(noInverse
      ? []
      : [
          {
            name: 'inverse',
            default: false,
          },
        ]),
    {
      name: 'tidy',
      default: false,
    },
    {
      name: 'compute',
      default: true,
    },
  ];
  return BlurrOperation<Args, TR>({
    sourceType: 'dataframe',
    targetType: 'value',
    name: operationCreator.name,
    args: [...args1, ...(operationCreator.args || []), ...args2],
  });
}

function AnyOperation<TA extends ArgsType = NoArgs>(
  operationCreator: OperationCreator,
  noCols = false,
  noInverse = false
) {
  return MaskColsOperation<TA, ColsResult<boolean>>(
    operationCreator,
    noCols,
    noInverse
  );
}

function CountOperation<TA extends ArgsType = NoArgs>(
  operationCreator: OperationCreator,
  noCols = false,
  noInverse = false
) {
  return MaskColsOperation<TA, ColsResult<number>>(
    operationCreator,
    noCols,
    noInverse
  );
}

export const operations = {
  anyGreaterThan: AnyOperation<{ value: PythonCompatible }>({
    name: 'cols.anyGreaterThan',
    args: [{ name: 'value' }],
  }),
  anyGreaterThanEqual: AnyOperation<{ value: PythonCompatible }>({
    name: 'cols.anyGreaterThanEqual',
    args: [{ name: 'value' }],
  }),
  anyLessThan: AnyOperation<{ value: PythonCompatible }>({
    name: 'cols.anyLessThan',
    args: [{ name: 'value' }],
  }),
  anyLessThanEqual: AnyOperation<{ value: PythonCompatible }>({
    name: 'cols.anyLessThanEqual',
    args: [{ name: 'value' }],
  }),
  anyBetween: AnyOperation<{
    lowerBound: number;
    upperBound: number;
    includeBounds: boolean;
    bounds: [number, number][];
  }>({
    name: 'cols.anyBetween',
    args: [
      { name: 'lowerBound' },
      { name: 'upperBound' },
      { name: 'includeBounds', default: true },
      { name: 'bounds' },
    ],
  }),
  anyEqual: AnyOperation<{ value: PythonCompatible }>({
    name: 'cols.anyEqual',
    args: [{ name: 'value' }],
  }),
  anyNotEqual: AnyOperation<{ value: PythonCompatible }>({
    name: 'cols.anyNotEqual',
    args: [{ name: 'value' }],
  }),
  anyMissing: AnyOperation({
    name: 'cols.anyMissing',
  }),
  anyNull: AnyOperation({
    name: 'cols.anyNull',
  }),
  anyNone: AnyOperation({
    name: 'cols.anyNone',
  }),
  anyNan: AnyOperation({
    name: 'cols.anyNan',
  }),
  anyEmpty: AnyOperation({
    name: 'cols.anyEmpty',
  }),
  anyMismatch: AnyOperation({
    name: 'cols.anyMismatch',
  }),
  anyDuplicated: AnyOperation({
    name: 'cols.anyDuplicated',
  }),
  anyUniques: AnyOperation({
    name: 'cols.anyUniques',
  }),
  anyMatch: AnyOperation<{ regex: string; dataType: string }>({
    name: 'cols.anyMatch',
    args: [
      {
        name: 'regex',
      },
      {
        name: 'dataType',
      },
    ],
  }),
  anyMatchDataType: AnyOperation<{ dataType: string }>({
    name: 'cols.anyMatchDataType',
    args: [
      {
        name: 'dataType',
      },
    ],
  }),
  anyMatchRegex: AnyOperation<{ regex: string }>({
    name: 'cols.anyMatchRegex',
    args: [
      {
        name: 'regex',
      },
    ],
  }),
  anyStartingWith: AnyOperation<{ value: string }>({
    name: 'cols.anyStartingWith',
    args: [{ name: 'value' }],
  }),
  anyEndingWith: AnyOperation<{ value: string }>({
    name: 'cols.anyEndingWith',
    args: [{ name: 'value' }],
  }),
  anyContaining: AnyOperation<{ value: string }>({
    name: 'cols.anyContaining',
    args: [{ name: 'value' }],
  }),
  anyValuesIn: AnyOperation<{ values: PythonCompatible[] }>({
    name: 'cols.anyValuesIn',
    args: [{ name: 'values' }],
  }),
  anyMatchPattern: AnyOperation<{ pattern: string }>({
    name: 'cols.anyMatchPattern',
    args: [{ name: 'pattern' }],
  }),
  anyExpression: AnyOperation<{ value: PythonCompatible }>({
    name: 'cols.anyExpression',
    args: [{ name: 'value' }],
  }),
  anyStr: AnyOperation({
    name: 'cols.anyStr',
  }),
  anyInt: AnyOperation({
    name: 'cols.anyInt',
  }),
  anyFloat: AnyOperation({
    name: 'cols.anyFloat',
  }),
  anyNumeric: AnyOperation({
    name: 'cols.anyNumeric',
  }),
  anyEmail: AnyOperation({
    name: 'cols.anyEmail',
  }),
  anyIp: AnyOperation({
    name: 'cols.anyIp',
  }),
  anyUrl: AnyOperation({
    name: 'cols.anyUrl',
  }),
  anyGender: AnyOperation({
    name: 'cols.anyGender',
  }),
  anyBoolean: AnyOperation({
    name: 'cols.anyBoolean',
  }),
  anyZipCode: AnyOperation({
    name: 'cols.anyZipCode',
  }),
  anyCreditCardNumber: AnyOperation({
    name: 'cols.anyCreditCardNumber',
  }),
  anyDatetime: AnyOperation({
    name: 'cols.anyDatetime',
  }),
  anyObject: AnyOperation({
    name: 'cols.anyObject',
  }),
  anyArray: AnyOperation({
    name: 'cols.anyArray',
  }),
  anyPhoneNumber: AnyOperation({
    name: 'cols.anyPhoneNumber',
  }),
  anySocialSecurityNumber: AnyOperation({
    name: 'cols.anySocialSecurityNumber',
  }),
  anyHttpCode: AnyOperation({
    name: 'cols.anyHttpCode',
  }),
  countZeros: CountOperation({
    name: 'cols.countZeros',
  }),
  countGreaterThan: CountOperation<{ value: PythonCompatible }>({
    name: 'cols.countGreaterThan',
    args: [{ name: 'value' }],
  }),
  countGreaterThanEqual: CountOperation<{ value: PythonCompatible }>({
    name: 'cols.countGreaterThanEqual',
    args: [{ name: 'value' }],
  }),
  countLessThan: CountOperation<{ value: PythonCompatible }>({
    name: 'cols.countLessThan',
    args: [{ name: 'value' }],
  }),
  countLessThanEqual: CountOperation<{ value: PythonCompatible }>({
    name: 'cols.countLessThanEqual',
    args: [{ name: 'value' }],
  }),
  countBetween: CountOperation<{
    lowerBound: number;
    upperBound: number;
    includeBounds: boolean;
    bounds: [number, number][];
  }>({
    name: 'cols.countBetween',
    args: [
      { name: 'lowerBound' },
      { name: 'upperBound' },
      { name: 'includeBounds', default: true },
      { name: 'bounds' },
    ],
  }),
  countEqual: CountOperation<{ value: PythonCompatible }>({
    name: 'cols.countEqual',
    args: [{ name: 'value' }],
  }),
  countNotEqual: CountOperation<{ value: PythonCompatible }>({
    name: 'cols.countNotEqual',
    args: [{ name: 'value' }],
  }),
  countMissings: CountOperation({
    name: 'cols.countMissings',
  }),
  countNulls: CountOperation({
    name: 'cols.countNulls',
  }),
  countNone: CountOperation({
    name: 'cols.countNone',
  }),
  countNan: CountOperation({
    name: 'cols.countNan',
  }),
  countEmpty: CountOperation({
    name: 'cols.countEmpty',
  }),
  countMismatch: CountOperation({
    name: 'cols.countMismatch',
  }),
  countDuplicated: CountOperation({
    name: 'cols.countDuplicated',
  }),
  countUniques: CountOperation(
    {
      name: 'cols.countUniques',
      args: [
        {
          name: 'estimate',
          default: false,
        },
      ],
    },
    false,
    true
  ),
  countMatch: CountOperation<{ regex: string; dataType: string }>({
    name: 'cols.countMatch',
    args: [
      {
        name: 'regex',
      },
      {
        name: 'dataType',
      },
    ],
  }),
  countDataType: CountOperation({
    name: 'cols.countDataType',
  }),
  countRegex: CountOperation({
    name: 'cols.countRegex',
  }),
  countStartingWith: CountOperation<{ value: string }>({
    name: 'cols.countStartingWith',
    args: [{ name: 'value' }],
  }),
  countEndingWith: CountOperation<{ value: string }>({
    name: 'cols.countEndingWith',
    args: [{ name: 'value' }],
  }),
  countContaining: CountOperation<{ value: string }>({
    name: 'cols.countContaining',
    args: [{ name: 'value' }],
  }),
  countValuesIn: CountOperation<{ values: PythonCompatible[] }>({
    name: 'cols.countValuesIn',
    args: [{ name: 'values' }],
  }),
  countMatchPattern: CountOperation<{ pattern: string }>({
    name: 'cols.countMatchPattern',
    args: [{ name: 'pattern' }],
  }),
  countExpression: CountOperation<{ value: PythonCompatible }>({
    name: 'cols.countExpression',
    args: [{ name: 'value' }],
  }),
  countStr: CountOperation({
    name: 'cols.countStr',
  }),
  countInt: CountOperation({
    name: 'cols.countInt',
  }),
  countFloat: CountOperation({
    name: 'cols.countFloat',
  }),
  countNumeric: CountOperation({
    name: 'cols.countNumeric',
  }),
  countEmail: CountOperation({
    name: 'cols.countEmail',
  }),
  countIp: CountOperation({
    name: 'cols.countIp',
  }),
  countUrl: CountOperation({
    name: 'cols.countUrl',
  }),
  countGender: CountOperation({
    name: 'cols.countGender',
  }),
  countBoolean: CountOperation({
    name: 'cols.countBoolean',
  }),
  countZipCode: CountOperation({
    name: 'cols.countZipCode',
  }),
  countCreditCardNumber: CountOperation({
    name: 'cols.countCreditCardNumber',
  }),
  countDatetime: CountOperation({
    name: 'cols.countDatetime',
  }),
  countObject: CountOperation({
    name: 'cols.countObject',
  }),
  countArray: CountOperation({
    name: 'cols.countArray',
  }),
  countPhoneNumber: CountOperation({
    name: 'cols.countPhoneNumber',
  }),
  countSocialSecurityNumber: CountOperation({
    name: 'cols.countSocialSecurityNumber',
  }),
  countHttpCode: CountOperation({
    name: 'cols.countHttpCode',
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
