export {};

declare global {
  interface ClientOptions {
    server?: Server;
  }
  type OperationCaller = (
    name: string,
    kwargs?: Record<string, PythonCompatible>,
    args?: Array<PythonCompatible>
  ) => Promise<PythonCompatible>;
  interface Client {
    operationCaller: OperationCaller;
    backendServer: Server;
    [key: string]: unknown;
  }
}

// export declare function BlurrClient(options?: ClientOptions): number;
