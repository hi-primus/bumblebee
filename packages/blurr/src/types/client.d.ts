import { operations } from '../lib/operations/client';

import { BackendOptions, RunsCode, Server } from './server';
export interface ClientOptions {
  server?: Server;
  serverOptions?: BackendOptions;
}

export type ClientFunctions = {
  [key in keyof typeof operations]: OmitFirstArgOnIntersection<
    typeof operations[key]['run']
  >;
};
export interface Client extends ClientFunctions, RunsCode {
  backendServer: Server;
  run: (
    kwargs: Record<string, OperationCompatible>
  ) => Promise<OperationCompatible>;
}
