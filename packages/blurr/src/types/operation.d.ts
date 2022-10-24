export {};

declare global {
  type OperationFunction = (
    kwargs?: Record<string, OperationCompatible>,
    args?: Array<OperationCompatible>
  ) => Promise<OperationCompatible>;
  interface Operation {
    sourceType?: 'dataframe' | 'variable' | 'none';
    targetType?: 'dataframe' | 'value' | 'void';
    name: string;
    initialization?: (server: Server) => Promise<PythonCompatible>;
    callback: (
      server: Server,
      kwargs: Record<string, PythonCompatible>,
      args: Array<PythonCompatible>
    ) => Promise<PythonCompatible>;
  }
}
