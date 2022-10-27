import { RunsCode } from './server';

export {};

export interface OperationCreator {
  sourceType?: 'dataframe' | 'variable' | 'none';
  targetType?: 'dataframe' | 'value' | 'void';
  name: string;
  initialize?: (client: RunsCode) => Promise<PythonCompatible>;
  getInitializationCode?: () => string;
  run?: (
    client: RunsCode,
    kwargs?: Record<string, PythonCompatible>,
    args?: Array<PythonCompatible>
  ) => Promise<PythonCompatible>;
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
