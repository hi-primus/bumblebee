export type { Source } from '../../types/source';
import { Client, ClientFunctions, ClientOptions } from '../../types/client';
import { BlurrServer } from '../server';
import { adaptKwargs, isName, isStringRecord } from '../utils';

import { BlurrSource } from './data/source';
import { operations } from './operations/client';

export function BlurrClient(options: ClientOptions = {}): Client {
  const backendServer = options.server
    ? options.server
    : BlurrServer(options?.serverOptions);

  const client = {
    backendServer,
    run: async (
      params: Record<string, OperationCompatible> & {
        operationKey: string;
        operationType: OperationType;
      }
    ) => {
      console.log('🛼 Sending params:', params);
      const result = await backendServer.run(params);
      if (isName(result)) {
        return BlurrSource(client, result.toString());
      }
      return result;
    },
    runCode: (code: string) => {
      // TODO: check if it's debug
      return backendServer.runCode(code);
    },
    supports: backendServer.supports,
    setGlobal: backendServer.setGlobal,
    donePromise: backendServer.donePromise,
  };

  const clientFunctions: Partial<ClientFunctions> = {};

  for (const key in operations) {
    const operationArgs = operations[key].args;
    clientFunctions[key] = (...args) => {
      let _args: InputArgs;
      if (args.length === 1 && isStringRecord(args[0])) {
        _args = args[0] as InputArgs;
      } else {
        _args = args;
      }
      const kwargs = adaptKwargs(_args, operationArgs);
      return client.run({
        ...kwargs,
        operationKey: key,
        operationType: 'client',
      });
    };
  }

  return { ...client, ...(clientFunctions as ClientFunctions) };
}
