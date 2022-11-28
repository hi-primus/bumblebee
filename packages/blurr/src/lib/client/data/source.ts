import { PyProxy } from 'pyodide';

import type { Client } from '../../../types/client';
import type {
  FutureSource,
  SourceFunctions,
  SourceFunctionsCols,
  SourceFunctionsRows,
  Source as SourceInterface,
} from '../../../types/source';
import { operations } from '../../operations/dataframe';
import { operations as colsOperations } from '../../operations/dataframe/cols';
import { operations as rowsOperatons } from '../../operations/dataframe/rows';
import {
  adaptKwargs,
  generateUniqueVariableName,
  isName,
  isObject,
  isPromiseLike,
} from '../../utils';

export function isSource(value): value is SourceInterface {
  return (
    isObject(value) && '_blurrMember' in value && value._blurrMember == 'source'
  );
}

export function Source(
  client: Client,
  nameOrPyProxy?: string | PyProxy
): SourceInterface {
  if (!client) {
    throw new Error('A source can only be initialized using a client');
  }

  const source = {} as SourceInterface;

  if (typeof nameOrPyProxy === 'string') {
    source.name = nameOrPyProxy;
  } else {
    source.data = nameOrPyProxy;
  }

  if (!source.name) {
    source.name = generateUniqueVariableName('source');
  }

  source.client = client;
  source.paramsQueue = [];
  source.toString = () => source.name;
  source._blurrMember = 'source';

  function adaptFunctions(operations, operationType) {
    const functions = {};
    for (const key in operations) {
      const operationArgs = operations[key].args;
      functions[key] = (...args) => {
        let _args: InputArgs;
        if (args.length === 1 && isObject(args[0])) {
          _args = args[0] as InputArgs;
        } else {
          _args = args;
        }
        let kwargs = adaptKwargs(_args, operationArgs);
        kwargs = {
          ...(kwargs || {}),
          source: source,
        };
        return client.run({
          ...kwargs,
          operationKey: key,
          operationType,
        });
      };
    }
    return functions;
  }

  Object.assign(
    source,
    adaptFunctions(operations, 'dataframe') as SourceFunctions
  );
  source.cols = adaptFunctions(colsOperations, 'cols') as SourceFunctionsCols;
  source.rows = adaptFunctions(rowsOperatons, 'rows') as SourceFunctionsRows;
  source.persist = (): PromiseOr<SourceInterface> => {
    if (!source.paramsQueue.length) {
      console.log("Run 'persist' on a source with no pending operations");
      const newSource = Source(client, source.data || source.name);
      delete (newSource as FutureSource).then;
      return newSource;
    }
    const result = client.send(source.paramsQueue);

    const _persist = (result) => {
      if (isName(result) || isSource(result)) {
        const newSource = Source(
          client,
          (result as SourceInterface).data || result.toString()
        );
        delete (newSource as FutureSource).then;
        return newSource;
      }
      const paramsWithTarget = source.paramsQueue.filter((p) => 'target' in p);
      let lastTarget = paramsWithTarget[paramsWithTarget.length - 1].target;
      if (!lastTarget) {
        lastTarget = source.toString();
      }
      if (isSource(lastTarget) || isName(lastTarget)) {
        lastTarget = lastTarget.toString();
      }
      if (typeof lastTarget === 'string') {
        console.log(
          'Creating a new source with the result of the pending operations'
        );
        const newSource = Source(client, lastTarget);
        delete (newSource as FutureSource).then;
        return newSource;
      }
      console.warn("Can't persist source, unknown name.", result);
      throw new Error("Can't persist source, unknown name.");
    };

    if (isPromiseLike(result)) {
      return result.then(_persist);
    }
    return _persist(result);
  };
  (source as FutureSource).then = (onfulfilled) => {
    const result = source.persist();
    if (!isPromiseLike(result)) {
      return new Promise(() => onfulfilled(result));
    }
    return result.then(onfulfilled);
  };

  return source;
}
