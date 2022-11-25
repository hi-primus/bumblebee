import { operations } from '../lib/operations/client';

import { RunsCode, Server, ServerOptions } from './server';
export interface ClientOptions {
  server?: Server;
  serverOptions?: ServerOptions;
}

export type ClientFunctions = {
  [K in keyof typeof operations]: AdaptOperation<typeof operations[K]>;
};
export interface Client extends ClientFunctions, RunsCode {
  options: ClientOptions;
  backendServer: Server;
  run: (
    kwargs: ArrayOrSingle<Record<string, OperationCompatible>>
  ) => PromiseOr<OperationCompatible>;
  sources: Record<string, string>;
  send(paramsQueue: Params[]): PromiseOr<OperationCompatible>;
}
