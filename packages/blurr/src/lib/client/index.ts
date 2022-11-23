export type { Source } from '../../types/source';
import { Client, ClientFunctions, ClientOptions } from '../../types/client';
import { getOperation } from '../operations';
import { operations } from '../operations/client';
import { makePythonCompatible } from '../operations/factory';
import { BlurrServer } from '../server';
import {
  adaptKwargs,
  generateUniqueVariableName,
  isName,
  isStringRecord,
} from '../utils';

import { BlurrSource, FutureSource, isSource } from './data/source';

export function BlurrClient(options: ClientOptions = {}): Client {
  const backendServer = options.server
    ? options.server
    : BlurrServer(options?.serverOptions);

  const client = {} as Client;

  client.backendServer = backendServer;
  client.run = (paramsArray: ArrayOrSingle<Params>) => {
    if (!Array.isArray(paramsArray)) {
      paramsArray = [paramsArray];
    }

    console.log({ paramsArray });

    const firstParams = paramsArray[0];

    let paramsQueue = [] as Params[];

    if (firstParams && isSource(firstParams.source)) {
      paramsQueue = [...firstParams.source.paramsQueue];
    }

    paramsQueue.push(...paramsArray);

    const operations = paramsQueue.map((params) => {
      const { operationKey, operationType } = params;
      const operation = getOperation(operationKey, operationType);
      if (!operation) {
        throw new Error(
          `Operation '${operationKey}' of type '${operationType}' not found`
        );
      }
      return operation;
    });

    const lastOperation = operations[operations.length - 1];

    if (lastOperation && lastOperation.targetType === 'dataframe') {
      const lastParams = paramsQueue[paramsQueue.length - 1];
      if (!('target' in lastParams)) {
        lastParams.target = generateUniqueVariableName(
          lastOperation.targetType
        );
      }

      console.log('🛼 Returning without running:', lastParams);

      const newSource = BlurrSource(client, lastParams.target.toString());
      newSource.paramsQueue = paramsQueue;
      return newSource;
    }

    return client.send(paramsQueue);
  };

  client.send = (paramsQueue) => {
    console.log('🛼 Sending params:', paramsQueue);
    paramsQueue = makePythonCompatible(client, paramsQueue);
    return backendServer.run(paramsQueue).then((result) => {
      if (isName(result)) {
        const newSource = BlurrSource(client, result.toString());
        delete (newSource as FutureSource).then;
        return newSource;
      }
      return result;
    });
  };

  client.runCode = (code: string) => {
    // TODO: check if it's debug
    return backendServer.runCode(code);
  };
  client.sources = {};
  client.supports = backendServer.supports;
  client.setGlobal = backendServer.setGlobal;
  client.donePromise = backendServer.donePromise;

  const clientFunctions: Partial<ClientFunctions> = {};

  for (const key in operations) {
    const operationArgs = operations[key].args;
    const operationArgsNames = [
      'target',
      'source',
      ...operationArgs.map((arg) => arg.name),
    ];
    clientFunctions[key] = (...args) => {
      let _args: InputArgs;
      if (
        args.length === 1 &&
        isStringRecord(args[0]) &&
        Object.keys(args[0]).every((key) => operationArgsNames.includes(key))
      ) {
        _args = args[0] as InputArgs;
      } else {
        console.log({ operationArgsNames, args });
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

  Object.assign(client, clientFunctions);

  return client;
}
