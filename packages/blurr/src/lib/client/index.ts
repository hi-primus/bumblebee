import { BlurrServer } from '../server';

import { callOperation, getOperation } from './operations';

export function BlurrClient(options: ClientOptions = {}) {
  const backendServer = options.server ? options.server : BlurrServer();

  const client: Client = { backendServer };

  return new Proxy(client, {
    get(client: Client, name: string) {
      const operation = name !== 'valueOf' && getOperation(null, name);
      if (operation) {
        return (kwargs, args) => {
          return callOperation(client, operation, kwargs, args);
        };
      }
      return client[name];
    },
  });
}
