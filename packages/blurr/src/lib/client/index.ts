import { Client, ClientFunctions, ClientOptions } from '../../types/client';
import { BlurrServer } from '../server';
import { adaptKwargs, isStringRecord, objectMap } from '../utils';

import { operations } from './operations';

export type { Client } from '../../types/client';
export type { Source } from '../../types/source';

export function BlurrClient(options: ClientOptions = {}): Client {
  const backendServer = options.server
    ? options.server
    : BlurrServer(options?.serverOptions);

  const client = {
    backendServer,
    // run: (params: Record<string, OperationCompatible>) => backendServer.run(params), // TODO: use this
    run: backendServer.run,
    supports: backendServer.supports,
    setGlobal: backendServer.setGlobal,
    donePromise: backendServer.donePromise,
  };

  const clientFunctions = objectMap(operations, (operation) => {
    return (...args) => {
      let _args: InputArgs;
      if (args.length === 1 && isStringRecord(args[0])) {
        _args = args[0] as InputArgs;
      } else {
        _args = args;
      }
      const kwargs = adaptKwargs(_args, operation.args);
      return operation.run(client, kwargs);
    };
  }) as ClientFunctions;

  return { ...client, ...clientFunctions };
}
