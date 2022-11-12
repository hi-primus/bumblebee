import { RunsCode } from '../../../types/server';
import { Source } from '../../../types/source';
import { SourceFunctions } from '../../../types/source';
import {
  adaptKwargs,
  generateUniqueVariableName,
  isObject,
  objectMap,
} from '../../utils';
import { operations } from '../operations/dataframe';

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

  const sourceFunctions = objectMap(operations, (operation) => {
    return (...args) => {
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
  }) as SourceFunctions;

  return { ...source, ...sourceFunctions, _blurrMember: 'source' };
}

export type { Source };
