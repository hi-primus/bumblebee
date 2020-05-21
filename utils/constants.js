export const TYPES = {
  INT: "int",
  DECIMAL: "decimal",
  STRING: "string",
  BOOLEAN: "boolean",
  DATE: "date",
  ARRAY: "array",
  OBJECT: "object",
  GENDER: "gender",
  IP: "ip",
  URL: "url",
  EMAIL: "email",
  CREDIT_CARD_NUMBER: "credit_card_number",
  ZIP_CODE: "zip_code",
  MISSING: "missing",
  CATEGORICAL: "categorical",
  TIME: "time"
}

export const TYPES_HINTS = {
  "int": "#",
  "decimal": "#.##",
  "string": "ABC",
  "boolean": "0/1",
  "date": "📅",
  "array": "[ ]",
  "object": "obj",
  "gender": "gen",
  "ip": "ip",
  "url": "url",
  "email": "a@b",
  "credit_card_number": "####",
  "zip_code": "zip",
  "missing": "mis",
  "categorical": "cat",
  "time": "time"
}

export const TYPES_NAMES = {
  "int": "Integer",
  "decimal": "Decimal",
  "string": "String",
  "boolean": "Boolean",
  "date": "Date",
  "array": "Array",
  "object": "Object",
  "gender": "Gender",
  "ip": "IP Address",
  "url": "URL",
  "email": "Email",
  "credit_card_number": "Credit Card Number",
  "zip_code": "Zip Code",
  "missing": "Missing",
  "categorical": "Categorical",
  "time": "Time"
}

export const ALL_TYPES = Object.values(TYPES)

export const STRING_TYPES = [
  TYPES.STRING,
  TYPES.OBJECT,
  TYPES.CATEGORICAL,
  TYPES.DATE,
  TYPES.TIME
]
