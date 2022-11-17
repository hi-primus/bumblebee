import { operations as dataframeOperations } from '../lib/operations/dataframe';
import { operations as colsOperations } from '../lib/operations/dataframe/cols';
import { operations as rowsOperations } from '../lib/operations/dataframe/rows';

import { Operation } from './operation';
import { RunsCode } from './server';

// get keys of a const for a type
type KeysOfType<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

type OperationFunctions<T extends Record<string, Operation>> = {
  [K in keyof T]: OmitFirstArgOnIntersection<PropType<T[K], 'run'>>;
};

export type SourceFunctions = OperationFunctions<typeof dataframeOperations>;

export type SourceFunctionsCols = OperationFunctions<typeof colsOperations>;
export type SourceFunctionsRows = OperationFunctions<typeof rowsOperations>;

export interface Source extends SourceFunctions {
  name: string;
  client: RunsCode;
  _blurrMember: 'source';
  toString: () => string;
  cols: SourceFunctionsCols;
  rows: SourceFunctionsRows;
}
