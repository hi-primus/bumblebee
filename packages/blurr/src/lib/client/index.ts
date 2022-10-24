import { BlurrServer } from '../server';

import { operations } from './operations';

export function BlurrClient(options: ClientOptions = {}) {
  const backendServer = options.server ? options.server : BlurrServer();

  const operationCaller: OperationCaller = async (
    name = null,
    kwargs: Record<string, PythonCompatible> = {},
    args: Array<PythonCompatible> = []
  ) => {
    // await backendServer.backendPromise;
    if (name in operations) {
      operations[name].initialization &&
        operations[name].initialization(backendServer);
      return operations[name].callback(backendServer, kwargs, args);
    }
    throw new Error(`'${name}' operation not found.`);
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
