import type { Cols, NoArgs, SourceArg } from '../../../../types/arguments';
import type { ArgsType, OperationCreator } from '../../../../types/operation';
import type { Source } from '../../../../types/source';
import { BlurrOperation } from '../../factory';

function DataframeOperation<
  TA extends ArgsType = ArgsType,
  TR extends OperationCompatible = Source
>(operationCreator: OperationCreator) {
  return BlurrOperation<TA, TR>({
    ...operationCreator,
    sourceType: 'dataframe',
  });
}

function DropValueRowsOperation(name: string) {
  return DataframeOperation<{
    cols: Cols;
    value: string;
    how: 'any' | 'all';
  }>({
    targetType: 'dataframe',
    name,
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'value',
        default: false,
      },
      {
        name: 'how',
        default: 'any',
      },
    ],
  });
}

function SelectTypeRowsOperation(name: string) {
  return DataframeOperation<{
    cols: Cols;
    drop: boolean;
    how: 'any' | 'all';
  }>({
    targetType: 'dataframe',
    name,
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'drop',
        default: false,
      },
      {
        name: 'how',
        default: 'any',
      },
    ],
  });
}

function SelectRowsOperation(name: string) {
  return DataframeOperation<{
    cols: Cols;
    how: 'any' | 'all';
  }>({
    targetType: 'dataframe',
    name,
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'how',
        default: 'any',
      },
    ],
  });
}

function SelectValueRowsOperation(name: string) {
  return DataframeOperation<{
    cols: Cols;
    value: number;
    drop: boolean;
    how: 'any' | 'all';
  }>({
    targetType: 'dataframe',
    name,
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'value',
        default: 0,
      },
      {
        name: 'drop',
        default: false,
      },
      {
        name: 'how',
        default: 'any',
      },
    ],
  });
}

export const operations = {
  append: DataframeOperation<{ dfs: SourceArg[]; namesMap: number }, Source>({
    targetType: 'dataframe',
    name: 'rows.append',
    args: [
      {
        name: 'dfs',
        required: true,
      },
      {
        name: 'namesMap',
        default: null,
      },
    ],
  }),
  select: DataframeOperation<
    { expr: string; contains: string | string[]; case; flags; na; regex },
    Source
  >({
    targetType: 'dataframe',
    name: 'rows.select',
    args: [
      {
        name: 'expr',
        default: null,
      },
      {
        name: 'contains',
        default: null,
      },
      {
        name: 'case',
        default: null,
      },
      {
        name: 'flags',
        default: 0,
      },
      {
        name: 'na',
        default: false,
      },
      {
        name: 'regex',
        default: false,
      },
    ],
  }),
  count: DataframeOperation<{ compute: string }, number>({
    targetType: 'value',
    name: 'rows.count',
    args: [
      {
        name: 'compute',
        default: true,
      },
    ],
  }),
  toList: DataframeOperation<{ cols: Cols }, PythonCompatible>({
    targetType: 'value',
    name: 'rows.toList',
    args: [
      {
        name: 'Cols',
        default: '*',
      },
    ],
  }),
  sort: DataframeOperation<{ cols: Cols; order: string; cast: boolean }>({
    targetType: 'dataframe',
    name: 'rows.sort',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'desc',
        default: true,
      },
      {
        name: 'cast',
        default: true,
      },
    ],
  }),
  reverse: DataframeOperation<NoArgs, Source>({
    targetType: 'dataframe',
    name: 'rows.reverse',
  }),
  drop: DataframeOperation<
    {
      cols: Cols;
      where: string;
    },
    Source
  >({
    targetType: 'dataframe',
    name: 'rows.drop',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'where',
        default: null,
      },
    ],
  }),
  limit: DataframeOperation<
    {
      count: number;
    },
    Source
  >({
    targetType: 'dataframe',
    name: 'rows.limit',
    args: [
      {
        name: 'limit',
        default: 10,
      },
    ],
  }),
  unnest: DataframeOperation<
    {
      cols: Cols;
      outputCols: Cols;
    },
    Source
  >({
    targetType: 'dataframe',
    name: 'rows.unnest',
    args: [
      {
        name: 'cols',
        default: '*',
      },
    ],
  }),
  approxCount: DataframeOperation<NoArgs, number>({
    targetType: 'value',
    name: 'rows.approxCount',
  }),
  str: SelectTypeRowsOperation('rows.str'),
  int: SelectTypeRowsOperation('rows.int'),
  float: SelectTypeRowsOperation('rows.float'),
  numeric: SelectTypeRowsOperation('rows.numeric'),
  between: DataframeOperation<{
    lowerBound: number;
    upperBound: number;
    includeBounds: boolean;
    bounds: [];
    drop: boolean;
    how: 'any' | 'all';
  }>({
    targetType: 'dataframe',
    name: 'rows.between',
    args: [
      {
        name: 'lowerBound',
        default: null,
      },
      {
        name: 'upperBound',
        default: null,
      },
      {
        name: 'includeBounds',
        default: null,
      },
      {
        name: 'bounds',
        default: true,
      },
      {
        name: 'drop',
        default: false,
      },
      {
        name: 'how',
        default: 'any',
      },
    ],
  }),
  greatherThanEqual: SelectValueRowsOperation('rows.greatherThanEqual'),
  greatherThan: SelectValueRowsOperation('rows.greatherThan'),
  lessThanEqual: SelectValueRowsOperation('rows.lessThanEqual'),
  lessThan: SelectValueRowsOperation('rows.lessThan'),
  equal: SelectValueRowsOperation('rows.equal'),
  notEqual: SelectValueRowsOperation('rows.notEqual'),
  missing: SelectTypeRowsOperation('rows.missing'),
  null: SelectTypeRowsOperation('rows.null'),
  none: SelectTypeRowsOperation('rows.none'),
  nan: SelectTypeRowsOperation('rows.nan'),
  empty: SelectTypeRowsOperation('rows.empty'),
  duplicated: DataframeOperation<{
    cols: Cols;
    keep: 'first' | 'last' | false;
    drop: boolean;
    how: 'any' | 'all';
  }>({
    targetType: 'dataframe',
    name: 'rows.duplicated',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'keep',
        default: 'first',
      },
      {
        name: 'drop',
        default: false,
      },
      {
        name: 'how',
        default: 'any',
      },
    ],
  }),
  unique: DataframeOperation<{
    cols: Cols;
    keep: 'first' | 'last' | false;
    drop: boolean;
    how: 'any' | 'all';
  }>({
    targetType: 'dataframe',
    name: 'rows.unique',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'keep',
        default: 'first',
      },
      {
        name: 'drop',
        default: false,
      },
      {
        name: 'how',
        default: 'any',
      },
    ],
  }),
  mismatch: DataframeOperation<{
    cols: Cols;
    dataType: string;
    drop: boolean;
    how: 'any' | 'all';
  }>({
    targetType: 'dataframe',
    name: 'rows.mismatch',
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
        name: 'drop',
        default: false,
      },
      {
        name: 'how',
        default: 'any',
      },
    ],
  }),
  match: DataframeOperation<{
    cols: Cols;
    regex: string;
    dataType: string;
    drop: boolean;
    how: 'any' | 'all';
  }>({
    targetType: 'dataframe',
    name: 'rows.match',
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
        name: 'drop',
        default: false,
      },
      {
        name: 'how',
        default: 'any',
      },
    ],
  }),
  matchRegex: DataframeOperation<{
    cols: Cols;
    regex: string;
    dataType: string;
    drop: boolean;
    how: 'any' | 'all';
  }>({
    targetType: 'dataframe',
    name: 'rows.matchRegex',
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
        name: 'drop',
        default: false,
      },
      {
        name: 'how',
        default: 'any',
      },
    ],
  }),
  valueIn: DataframeOperation<{
    cols: Cols;
    values: BasicPythonCompatible[];
    dataType: string;
    drop: boolean;
    how: 'any' | 'all';
  }>({
    targetType: 'dataframe',
    name: 'rows.valueIn',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'values',
        default: null,
      },
      {
        name: 'dataType',
        default: null,
      },
      {
        name: 'drop',
        default: false,
      },
      {
        name: 'how',
        default: 'any',
      },
    ],
  }),
  pattern: DataframeOperation<{
    cols: Cols;
    pattern: string;
    drop: boolean;
    how: 'any' | 'all';
  }>({
    targetType: 'dataframe',
    name: 'rows.pattern',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'pattern',
        default: null,
      },
      {
        name: 'drop',
        default: false,
      },
      {
        name: 'how',

        default: 'any',
      },
    ],
  }),
  startsWith: SelectValueRowsOperation('rows.startsWith'),
  endsWith: SelectValueRowsOperation('rows.endsWith'),
  contains: SelectValueRowsOperation('rows.contains'),
  find: SelectValueRowsOperation('rows.find'),
  email: SelectTypeRowsOperation('rows.email'),
  ip: SelectTypeRowsOperation('rows.ip'),
  url: SelectTypeRowsOperation('rows.url'),
  gender: SelectTypeRowsOperation('rows.gender'),
  boolean: SelectTypeRowsOperation('rows.boolean'),
  zipCode: SelectTypeRowsOperation('rows.zipCode'),
  creditCardNumber: SelectTypeRowsOperation('rows.creditCardNumber'),
  dateTime: SelectTypeRowsOperation('rows.dateTime'),
  object: SelectTypeRowsOperation('rows.object'),
  array: SelectTypeRowsOperation('rows.array'),
  phoneNumber: SelectTypeRowsOperation('rows.phoneNumber'),
  socialSecurityNumber: SelectTypeRowsOperation('rows.socialSecurityNumber'),
  HTTPCode: SelectTypeRowsOperation('rows.HTTPCode'),
  expression: DataframeOperation<{
    where: string;
    cols: Cols;
    drop: boolean;
    how: 'any' | 'all';
  }>({
    targetType: 'dataframe',
    name: 'rows.expression',
    args: [
      {
        name: 'where',
        default: null,
      },
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'drop',
        default: false,
      },
      {
        name: 'how',
        default: 'any',
      },
    ],
  }),
  dropStr: SelectRowsOperation('rows.dropStr'),
  dropInt: SelectRowsOperation('rows.dropInt'),
  dropFloat: SelectRowsOperation('rows.dropFloat'),
  dropNumeric: SelectRowsOperation('rows.dropNumeric'),
  dropGreaterThanEqual: DropValueRowsOperation('rows.dropGreaterThanEqual'),
  dropGreaterThan: DropValueRowsOperation('rows.dropGreaterThan'),
  dropLessThan: DropValueRowsOperation('rows.dropLessThan'),
  dropLessThanEqual: DropValueRowsOperation('rows.dropLessThanEqual'),
  dropBetween: DataframeOperation<{
    cols: Cols;
    lowerBound: number;
    upperBound: number;
    includeBounds: boolean;
    bounds: [number, number];
    drop: boolean;
    how: 'any' | 'all';
  }>({
    targetType: 'dataframe',
    name: 'rows.dropBetween',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'lowerBound',
        default: null,
      },
      {
        name: 'upperBound',
        default: null,
      },
      {
        name: 'includeBounds',
        default: false,
      },
      {
        name: 'bounds',
        default: null,
      },
      {
        name: 'drop',
        default: false,
      },
      {
        name: 'how',
        default: 'any',
      },
    ],
  }),
  dropEqual: DropValueRowsOperation('rows.dropEqual'),
  dropNotEqual: DropValueRowsOperation('rows.dropNotEqual'),
  dropMissing: SelectRowsOperation('rows.dropMissing'),
  dropNulls: SelectRowsOperation('rows.dropNulls'),
  dropNone: SelectRowsOperation('rows.dropNone'),
  dropNaN: SelectRowsOperation('rows.dropNaN'),
  dropEmpty: SelectRowsOperation('rows.dropEmpty'),
  dropDuplicated: DataframeOperation<{
    cols: Cols;
    keep: 'first' | 'last' | false;
    how: 'any' | 'all';
  }>({
    targetType: 'dataframe',
    name: 'rows.dropDuplicated',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'keep',
        default: 'first',
      },
      {
        name: 'how',
        default: 'any',
      },
    ],
  }),
  dropUniques: DataframeOperation<{
    cols: Cols;
    keep: 'first' | 'last' | false;
    how: 'any' | 'all';
  }>({
    targetType: 'dataframe',
    name: 'rows.dropUniques',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'keep',
        default: 'first',
      },
      {
        name: 'how',
        default: 'any',
      },
    ],
  }),
  dropMismatch: DataframeOperation<{
    cols: Cols;
    keep: 'first' | 'last' | false;
    how: 'any' | 'all';
  }>({
    targetType: 'dataframe',
    name: 'rows.dropMismatch',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'keep',
        default: 'first',
      },
      {
        name: 'how',
        default: 'any',
      },
    ],
  }),
  dropMatch: DataframeOperation<{
    cols: Cols;
    regex: string;
    dataType: string;
    how: 'any' | 'all';
  }>({
    targetType: 'dataframe',
    name: 'rows.dropMatch',
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
        name: 'how',
        default: 'any',
      },
    ],
  }),
  dropByRegex: DataframeOperation<{
    cols: Cols;
    regex: string;
    how: 'any' | 'all';
  }>({
    targetType: 'dataframe',
    name: 'rows.dropByRegex',
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
        name: 'how',
        default: 'any',
      },
    ],
  }),
  dropByDataType: DataframeOperation<{
    cols: Cols;
    dataType: string;
    how: 'any' | 'all';
  }>({
    targetType: 'dataframe',
    name: 'rows.dropByDataType',
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
        name: 'how',
        default: 'any',
      },
    ],
  }),
  dropValueIn: DropValueRowsOperation('rows.dropValueIn'),
  dropPattern: DataframeOperation<{
    cols: Cols;
    pattern: string;
    how: 'any' | 'all';
  }>({
    targetType: 'dataframe',
    name: 'rows.dropPattern',
    args: [
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'pattern',
        default: null,
      },
      {
        name: 'how',
        default: 'any',
      },
    ],
  }),
  dropStartsWith: DropValueRowsOperation('rows.dropStartsWith'),
  dropEndsWith: DropValueRowsOperation('rows.dropEndsWith'),
  dropContains: DropValueRowsOperation('rows.dropContains'),
  dropFind: DropValueRowsOperation('rows.dropFind'),
  dropEmails: SelectRowsOperation('rows.dropEmails'),
  dropIPs: SelectRowsOperation('rows.dropIPs'),
  dropURLs: SelectRowsOperation('rows.dropURLs'),
  dropGenders: SelectRowsOperation('rows.dropGenders'),
  dropBooleans: SelectRowsOperation('rows.dropBooleans'),
  dropZipCodes: SelectRowsOperation('rows.dropZipCodes'),
  dropCredirCardNumbers: SelectRowsOperation('rows.dropCredirCardNumbers'),
  dropDateTimes: SelectRowsOperation('rows.dropDateTimes'),
  dropArrays: SelectRowsOperation('rows.dropArrays'),
  dropPhoneNumbers: SelectRowsOperation('rows.dropPhoneNumbers'),
  dropSocialSecurityNumbers: SelectRowsOperation(
    'rows.dropSocialSecurityNumbers'
  ),
  dropHTTPCodes: SelectRowsOperation('rows.dropHTTPCodes'),
  dropByExpression: DataframeOperation<{
    where: string;
    cols: Cols;
    how: 'any' | 'all';
  }>({
    targetType: 'dataframe',
    name: 'rows.dropByExpression',
    args: [
      {
        name: 'where',
        default: null,
      },
      {
        name: 'cols',
        default: '*',
      },
      {
        name: 'how',
        default: 'any',
      },
    ],
  }),
};
