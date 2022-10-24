export {};

declare global {
  interface Operation {
    sourceType?: 'dataframe' | 'variable';
    name: string;
    initialization?: (server: Server) => Promise<PythonCompatible>;
    callback: (
      server: Server,
      kwargs: Record<string, PythonCompatible>,
      args: Array<PythonCompatible>
    ) => Promise<PythonCompatible>;
  }
}
