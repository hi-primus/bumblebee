import { KeyedColumn } from '@/types/dataframe';

export const TYPES = {
  INT: 'int',
  FLOAT: 'float',
  STRING: 'str',
  BOOLEAN: 'boolean',
  DATETIME: 'datetime',
  ARRAY: 'array',
  OBJECT: 'object',
  TUPLE: 'tuple',
  GENDER: 'gender',
  IP: 'ip',
  URL: 'url',
  EMAIL: 'email',
  CREDIT_CARD_NUMBER: 'credit_card_number',
  ZIP_CODE: 'zip_code',
  MISSING: 'missing',
  CATEGORICAL: 'categorical',
  TIME: 'time',
  HTTP_CODE: 'http_code',
  NULL: 'null',
  UNKNOWN: 'unknown'
};

export const TYPES_HINTS: Record<ObjectValues<typeof TYPES>, string> = {
  int: '#',
  float: '#.##',
  str: 'ABC',
  boolean: '0/1',
  tuple: '( )',
  datetime: '📅',
  array: '[ ]',
  object: 'obj',
  gender: 'gen',
  ip: 'ip',
  url: 'url',
  email: 'a@b',
  credit_card_number: '####',
  zip_code: 'zip',
  missing: 'mis',
  categorical: 'cat',
  time: 'time',
  http_code: 'http',
  null: 'null',
  unknown: '   '
};

export const TYPES_NAMES: Record<ObjectValues<typeof TYPES>, string> = {
  int: 'Integer',
  float: 'Decimal',
  str: 'String',
  boolean: 'Boolean',
  datetime: 'Datetime',
  array: 'Array',
  object: 'Object',
  tuple: 'Tuple',
  gender: 'Gender',
  ip: 'IP Address',
  url: 'URL',
  email: 'Email',
  credit_card_number: 'Credit Card Number',
  zip_code: 'Zip Code',
  missing: 'Missing',
  categorical: 'Categorical',
  time: 'Time',
  http_code: 'HTTP Code',
  null: 'Null',
  unknown: 'Unknown'
};

export const getType = (columnProfile: KeyedColumn | null) => {
  if (columnProfile?.stats?.inferred_data_type) {
    if (typeof columnProfile.stats.inferred_data_type === 'string') {
      return columnProfile.stats.inferred_data_type;
    }
    return columnProfile.stats.inferred_data_type.data_type;
  }
  return columnProfile?.data_type || TYPES.UNKNOWN;
};

export const getCompleteType = (columnProfile: KeyedColumn | null) => {
  let dataType: string[] = [TYPES.UNKNOWN];
  if (columnProfile?.stats?.inferred_data_type) {
    if (typeof columnProfile.stats.inferred_data_type === 'string') {
      dataType = [columnProfile.stats.inferred_data_type];
    } else {
      dataType = [columnProfile.stats.inferred_data_type.data_type];
    }
    if (columnProfile.data_type) {
      dataType = dataType.concat(columnProfile.data_type);
    }
  } else if (columnProfile?.data_type) {
    dataType = [columnProfile.data_type];
  }
  return dataType as [string] | [string, string];
};
