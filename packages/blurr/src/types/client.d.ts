import { operations } from '../lib/client/operations';

export {};

declare global {
  interface ClientOptions {
    server?: Server;
  }

  type ClientFunctions = Partial<
    Record<keyof typeof operations, OperationFunction>
  >;
  interface Client extends ClientFunctions {
    backendServer: Server;
    run?: (string) => Promise<PythonCompatible>;
  }
}
