export {};

declare global {
  interface ClientOptions {
    server?: Server;
  }
  interface Client {
    backendServer: Server;
    [key: string]: unknown;
  }
}

// export declare function BlurrClient(options?: ClientOptions): number;
