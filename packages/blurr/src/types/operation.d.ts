import { RunsCode } from './server';

export {};

export interface OperationCreator {
  // the default variable name for the source
  name: string;
  // dataframe is for operations that take a dataframe as input
  // variable is for operations that take a variable as input
  // none is for operations that don't take any input
  sourceType?: 'dataframe' | 'variable' | 'none';
  // dataframe is for operations that return a dataframe
  // value is for operations that return a value
  // void is for operations that don't return anything
  targetType?: 'dataframe' | 'value' | 'void';
  // the name of the operation
  defaultSource?: string;
  // will be run on the server before the operation is run
  initialize?: (client: RunsCode) => Promise<PythonCompatible>;
  // generates the code that will be run on the server before the operation is run, replaces `initialize` if provided
  getInitializationCode?: () => string;
  // will be run on the server, replaces default operation if provided
  run?: (
    client: RunsCode,
    kwargs?: Record<string, PythonCompatible>
  ) => Promise<PythonCompatible>;
  // generates the code that will be run on the server when the operation is run, replaces `run` if provided
  getCode?: (kwargs?: Record<string, PythonCompatible>) => string;
}

type OperationInterface = Pick<
  OperationCreator,
  'name' | 'sourceType' | 'targetType' | 'initialize'
>;
export interface Operation<
  TA = OperationArgs<OperationCompatible>,
  TR = OperationCompatible
> extends OperationInterface {
  run: (client: RunsCode, kwargs?: TA) => Promise<TR>;
  _run: (
    client: RunsCode,
    kwargs?: Record<string, PythonCompatible>
  ) => Promise<PythonCompatible>;
  _blurrMember: 'operation';
}
