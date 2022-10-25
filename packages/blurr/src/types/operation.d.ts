export {};
declare global {
  type OperationFunction<T = OperationCompatible> = (
    kwargs?: Record<string, OperationCompatible>,
    args?: Array<OperationCompatible>
  ) => Promise<T>;

  interface OperationCreator {
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
  interface Operation<T = OperationCompatible>
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
}
