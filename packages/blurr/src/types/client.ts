import { operations } from '../lib/operations/client';

import { OperationFunctions } from './operation';
import { RunsCode, Server, ServerOptions } from './server';
export interface ClientOptions {
  server?: Server;
  serverOptions?: ServerOptions;
}

export type ClientFunctions = OperationFunctions<typeof operations>;

export interface Client extends RunsCode, ClientFunctions {
  options: ClientOptions;
  backendServer: Server;
  run: (kwargs: ArrayOrSingle<Params>) => PromiseOr<OperationCompatible>;
  sources: Record<string, string>;
  send(paramsQueue: Params[]): PromiseOr<OperationCompatible>;
}
