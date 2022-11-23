import { operations } from '../lib/operations/client';

import { BackendOptions, RunsCode, Server } from './server';
export interface ClientOptions {
  server?: Server;
  serverOptions?: BackendOptions;
}

export type ClientFunctions = {
  [K in keyof typeof operations]: AdaptOperation<typeof operations[K]>;
};
export interface Client extends ClientFunctions, RunsCode {
  backendServer: Server;
  run: (
    kwargs: ArrayOrSingle<Record<string, OperationCompatible>>
  ) => PromiseOr<OperationCompatible>;
  sources: Record<string, string>;
  send(paramsQueue: Params[]): Promise<OperationCompatible>;
}
