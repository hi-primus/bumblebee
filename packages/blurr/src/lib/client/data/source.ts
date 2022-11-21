import { Client } from '../../../types/client';
import {
  Source,
  SourceFunctions,
  SourceFunctionsCols,
  SourceFunctionsRows,
} from '../../../types/source';
import { operations } from '../../operations/dataframe';
import { operations as colsOperations } from '../../operations/dataframe/cols';
import { operations as rowsOperatons } from '../../operations/dataframe/rows';
import {
  adaptKwargs,
  generateUniqueVariableName,
  isName,
  isObject,
} from '../../utils';

export function isSource(value): value is Source {
  return (
    isObject(value) && '_blurrMember' in value && value._blurrMember == 'source'
  );
}

export function BlurrSource(client: Client, name?: string): Source {
  if (!client) {
    throw new Error('A source can only be initialized using a client');
  }
  if (!name) {
    name = generateUniqueVariableName('source');
  }

  const source = {} as Source;

  source.name = name;
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
  source.persist = async () => {
    if (!source.paramsQueue.length) {
      console.log("Run 'persist' on a source with no pending operations");
      const newSource = BlurrSource(client, source.name);
      delete newSource.then;
      return newSource;
    }
    const result = await client.send(source.paramsQueue);
    console.log('The result', result);
    if (isName(result) || isSource(result)) {
      console.log('Pending operations done');
      const newSource = BlurrSource(client, result.toString());
      delete newSource.then;
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
      const newSource = BlurrSource(client, lastTarget);
      delete newSource.then;
      return newSource;
    }
    console.warn("Can't persist source, unknown name.", result);
    throw new Error("Can't persist source, unknown name.");
  };
  source.then = (onfulfilled) => {
    return source.persist().then(onfulfilled);
  };

  return source;
}

export type { Source };
