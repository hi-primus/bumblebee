import { RunsCode } from '../../../types/server';
import {
  Source,
  SourceFunctionsCols,
  SourceFunctionsRows,
} from '../../../types/source';
import { SourceFunctions } from '../../../types/source';
import { adaptKwargs, generateUniqueVariableName, isObject } from '../../utils';
import { operations } from '../operations/dataframe';
import { operations as colsOperations } from '../operations/dataframe/cols';
import { operations as rowsOperatons } from '../operations/dataframe/rows';

export function isSource(value): value is Source {
  return (
    isObject(value) && '_blurrMember' in value && value._blurrMember == 'source'
  );
}

export function BlurrSource(client: RunsCode, name?: string): Source {
  if (!client) {
    throw new Error('A source can only be initialized using a client');
  }
  if (!name) {
    name = generateUniqueVariableName('source');
  }

  const source = {
    name,
    client,
    toString: () => name,
  };

  function adaptFunctions(operations) {
    const functions = {};
    for (const key in operations) {
      const operation = operations[key];
      functions[key] = (...args) => {
        let _args: InputArgs;
        if (args.length === 1 && isObject(args[0])) {
          _args = args[0] as InputArgs;
        } else {
          _args = args;
        }
        let kwargs = adaptKwargs(_args, operation.args);
        kwargs = {
          ...(kwargs || {}),
          source: source.toString(),
        };
        return operation.run(client, kwargs);
      };
    }
    return functions;
  }

  return {
    ...source,
    ...(adaptFunctions(operations) as SourceFunctions),
    cols: adaptFunctions(colsOperations) as SourceFunctionsCols,
    rows: adaptFunctions(rowsOperatons) as SourceFunctionsRows,
    _blurrMember: 'source',
  };
}

export type { Source };
