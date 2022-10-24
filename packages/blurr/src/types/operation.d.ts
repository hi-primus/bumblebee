export {};

declare global {
  // eslint-disable-next-line functional/no-mixed-type
  interface Operation {
    sourceType?: 'dataframe' | 'variable';
    name: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialization?: (server: Server) => Promise<any>;
    callback: (server: Server, kwargs: any, args: any) => Promise<any>;
  }
}
