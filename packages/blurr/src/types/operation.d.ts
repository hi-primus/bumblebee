import { RunsCode } from './server';

export {};

export interface OperationCreator {
  // dataframe is for operations that take a dataframe as input
  // variable is for operations that take a variable as input
  // none is for operations that don't take any input
  sourceType?: 'dataframe' | 'variable' | 'none';
  // dataframe is for operations that return a dataframe
  // value is for operations that return a value
  // void is for operations that don't return anything
  targetType?: 'dataframe' | 'value' | 'void';
  // the name of the operation
  name: string;
  // will be run on the server before the operation is run
  initialize?: (client: RunsCode) => Promise<PythonCompatible>;
  // generates the code that will be run on the server before the operation is run, replaces `initialize` if provided
  getInitializationCode?: () => string;
  // will be run on the server
  run?: (
    client: RunsCode,
    kwargs?: Record<string, PythonCompatible>,
    args?: Array<PythonCompatible>
  ) => Promise<PythonCompatible>;
  // generates the code that will be run on the server when the operation is run, replaces `run` if provided
  getCode?: (
    kwargs?: Record<string, PythonCompatible>,
    args?: Array<PythonCompatible>
  ) => string;
}
export interface Operation<T = OperationCompatible>
  extends Pick<
    OperationCreator,
    'sourceType' | 'targetType' | 'name' | 'initialize'
  > {
  run: (
    client: RunsCode,
    kwargs?: Record<string, OperationCompatible>,
    args?: Array<OperationCompatible>
  ) => Promise<T>;
  _run: (
    client: RunsCode,
    kwargs?: Record<string, PythonCompatible>,
    args?: Array<PythonCompatible>
  ) => Promise<PythonCompatible>;
  _blurrMember: 'operation';
}
