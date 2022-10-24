import { BlurrServer } from '../server';

import { operations } from './operations';

export function BlurrClient(options: ClientOptions = {}) {
  const backendServer = options.server ? options.server : BlurrServer();
  console.log('running client', options, operations);

  const operationCaller: OperationCaller = async (
    name = null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    kwargs: Record<string, any> = {},
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    args: Array<any> = []
  ) => {
    // await backendServer.backendPromise;
    if (name in operations) {
      return operations[name].callback(backendServer, kwargs, args);
    }
    return new Error(`'${name}' operation not found.`);
  };

  const client: Client = new Proxy(
    { backendServer, operationCaller },
    {
      get(client: Client, name: string) {
        console.log('get: name', name);
        if (!(name in client)) {
          return (kwargs, args) => client.operationCaller(name, kwargs, args);
        }
        return client[name];
      },
    }
  );

  return client;
}
