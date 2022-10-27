import { operations } from '../lib/client/operations';

export {};

declare global {
  interface ClientOptions {
    server?: Server;
    serverOptions?: BackendOptions;
  }

  type ClientFunctions = {
    [key in keyof typeof operations]: OmitFirstArg<
      PropType<typeof operations[key], 'run'>
    >;
  };
  interface Client extends ClientFunctions, RunsCode {
    backendServer: Server;
  }
}
