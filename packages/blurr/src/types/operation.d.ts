import { RunsCode } from './server';

export {};

export interface OperationArgument {
  // name of the argument
  name: string;
  // name of the argument in python
  argName?: string;
  // whether the argument is required
  required?: boolean;
  // default value of the argument
  default?: PythonCompatible;
}

export interface OperationCreator {
  // the default variable name for the source
  name: string;
  // the arguments for the operation
  args?: (OperationArgument | string)[];
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
  initialize?: (server: RunsCode) => Promise<PythonCompatible>;
  // generates the code that will be run on the server before the operation is run, replaces `initialize` if provided
  getInitializationCode?: () => string;
  // will be run on the server, replaces default operation if provided
  run?: (
    server: RunsCode,
    kwargs?: Record<string, PythonCompatible>
  ) => Promise<PythonCompatible>;
  // generates the code that will be run on the server when the operation is run, replaces `run` if provided
  getCode?: (kwargs?: Record<string, PythonCompatible>) => string;
}

type OperationInterface = Pick<
  OperationCreator,
  'name' | 'sourceType' | 'targetType' | 'initialize'
>;

export type ArgsType = OperationArgs<OperationCompatible>;

type RecordToArray<T> = T extends Record<string, infer R> ? R[] : [];

export type RunArgs<T extends ArgsType> =
  | RecordToArray<T>
  | [T]
  | [Record<string, OperationCompatible>?];

export interface Operation<
  TA extends ArgsType = ArgsType,
  TR extends OperationCompatible = OperationCompatible
> extends OperationInterface {
  args?: OperationArgument[];
  run: (server: RunsCode, ...args: RunArgs<TA>) => Promise<TR>;
  // | ((server: RunsCode, kwargs?: TA) => Promise<TR>);
  _run: (
    server: RunsCode,
    kwargs?: Record<string, PythonCompatible>
  ) => Promise<PythonCompatible>;
  _blurrMember: 'operation';
}
