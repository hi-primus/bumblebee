import { operations as dataframeOperations } from '../lib/operations/dataframe';
import { operations as colsOperations } from '../lib/operations/dataframe/cols';
import { operations as rowsOperations } from '../lib/operations/dataframe/rows';

import { OperationFunctions } from './operation';
import { PyodideSourceData } from './pyodide';
import { RunsCode } from './server';

export type SourceFunctions = OperationFunctions<typeof dataframeOperations>;
export type SourceFunctionsCols = OperationFunctions<typeof colsOperations>;
export type SourceFunctionsRows = OperationFunctions<typeof rowsOperations>;

type SourceData = PyodideSourceData;

export interface Source extends SourceFunctions {
  name: string;
  client: RunsCode;
  _blurrMember: 'source';
  toString: () => string;
  data?: SourceData;
  cols: SourceFunctionsCols;
  rows: SourceFunctionsRows;
  paramsQueue: Params[];
  persist: () => PromiseOr<Source>;
}

export interface FutureSource extends Source {
  then: (
    onfulfilled?: (result: Source) => Source,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onrejected?: (reason: any) => any
  ) => Promise<Source>;
}
