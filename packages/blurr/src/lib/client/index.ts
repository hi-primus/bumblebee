export type { Source } from '../../types/source';
import { Client, ClientFunctions, ClientOptions } from '../../types/client';
import { getOperation } from '../operations';
import { operations } from '../operations/client';
import { makePythonCompatible } from '../operations/factory';
import { BlurrServer, defaultOptions as defaultServerOptions } from '../server';
import {
  adaptKwargs,
  generateUniqueVariableName,
  isName,
  isPromiseLike,
  isStringRecord,
} from '../utils';

import { BlurrSource, FutureSource, isSource, Source } from './data/source';

export function BlurrClient(options: ClientOptions = {}): Client {
  const client = {} as Client;

  const serverOptions =
    (options.server ? options.server.options : options.serverOptions) || {};

  options.serverOptions = Object.assign(
    {},
    defaultServerOptions,
    serverOptions
  );

  client.options = options;

  client.backendServer = options.server
    ? options.server
    : BlurrServer(options?.serverOptions);

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

      if (!client.options.serverOptions.local) {
        console.log('🛼 Returning without running:', lastParams);

        const newSource = BlurrSource(client, lastParams.target.toString());
        newSource.paramsQueue = paramsQueue;
        return newSource;
      }
    }

    return client.send(paramsQueue);
  };

  client.send = (paramsQueue) => {
    console.log('🛼 Sending params:', paramsQueue);
    paramsQueue = makePythonCompatible(
      client,
      paramsQueue,
      client.options.serverOptions.local
    );
    const _send = (result) => {
      if (isName(result) || isSource(result)) {
        const newSource = BlurrSource(
          client,
          (result as Source).data || result.toString()
        );
        delete (newSource as FutureSource).then;
        return newSource;
      }
      if (
        client.options.serverOptions.local &&
        client.backendServer.pyodide.isPyProxy(result)
      ) {
        const newSource = BlurrSource(client, result);
        delete (newSource as FutureSource).then;
        return newSource;
      }
      return result;
    };
    const result = client.backendServer.run(paramsQueue);
    if (isPromiseLike(result)) {
      return result.then(_send);
    }
    return _send(result);
  };

  client.runCode = (code: string) => {
    // TODO: check if it's debug
    return client.backendServer.runCode(code);
  };
  client.sources = {};
  client.supports = client.backendServer.supports;
  // TODO: improve security in setGlobal and getGlobal
  client.setGlobal = client.backendServer.setGlobal;
  client.getGlobal = client.backendServer.getGlobal;
  client.donePromise = client.backendServer.donePromise;

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
