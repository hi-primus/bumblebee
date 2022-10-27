import { Client, ClientFunctions, ClientOptions } from '../../types/client';
import { BlurrServer } from '../server';
import { objectMap } from '../utils';

import { operations } from './operations';

export type { Client } from '../../types/client';
export type { Source } from '../../types/source';

export function BlurrClient(options: ClientOptions = {}): Client {
  const backendServer = options.server
    ? options.server
    : BlurrServer(options?.serverOptions);

  const client = {
    backendServer,
    run: backendServer.run,
    supports: backendServer.supports,
    setGlobal: backendServer.setGlobal,
    donePromise: backendServer.donePromise,
  };

  const clientFunctions = objectMap(operations, (operation) => {
    return (kwargs, args) => {
      return operation.run(client, kwargs, args);
    };
  }) as ClientFunctions;

  return { ...client, ...clientFunctions };
}
