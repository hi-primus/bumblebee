import { operations } from '../lib/client/operations';
import { Server, BackendOptions, RunsCode } from './server';
export interface ClientOptions {
  server?: Server;
  serverOptions?: BackendOptions;
}

export type ClientFunctions = {
  [key in keyof typeof operations]: OmitFirstArg<
    PropType<typeof operations[key], 'run'>
  >;
};
export interface Client extends ClientFunctions, RunsCode {
  backendServer: Server;
}
