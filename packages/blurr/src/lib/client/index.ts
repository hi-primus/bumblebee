import { BlurrServer } from '../server';
import { objectMap } from '../utils';

import { operations } from './operations';

export function BlurrClient(options: ClientOptions = {}): Client {
  const backendServer = options.server ? options.server : BlurrServer();

  const client = {
    backendServer,
    run: backendServer.run,
    donePromise: backendServer.donePromise,
  };

  const clientFunctions = objectMap(operations, (operation) => {
    return (kwargs, args) => {
      return operation.run(client, kwargs, args);
    };
  }) as ClientFunctions;

  return { ...client, ...clientFunctions };
}
