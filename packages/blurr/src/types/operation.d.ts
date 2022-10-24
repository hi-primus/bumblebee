export {};

declare global {
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
