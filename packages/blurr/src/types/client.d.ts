export {};

declare global {
  interface ClientOptions {
    server?: Server;
  }
  type OperationCaller = (
    name: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    kwargs?: Record<string, any>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    args?: Array<any>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => Promise<any>;
  // eslint-disable-next-line functional/no-mixed-type
  interface Client {
    operationCaller: OperationCaller;
    backendServer: Server;
    [key: string]: unknown;
  }
}

// export declare function BlurrClient(options?: ClientOptions): number;
