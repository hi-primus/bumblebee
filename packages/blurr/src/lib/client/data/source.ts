import { generateUniqueVariableName, isObject, objectMap } from '../../utils';
import { operations } from '../operations/dataframe';

export function isSource(value): value is Source {
  return (
    isObject(value) && '_blurrMember' in value && value._blurrMember == 'source'
  );
}

export function Source(name?: string, client?: RunsCode): Source {
  if (!client) {
    throw new Error('A source can only be initialized using a client');
  }
  if (!name) {
    name = generateUniqueVariableName('source');
  }

  const source = {
    name,
    client,
    _blurrMember: 'source',
    toString: () => name,
  };

  const sourceFunctions = objectMap(operations, (operation) => {
    return (kwargs, args) => {
      kwargs = {
        ...(kwargs || {}),
        source: source.toString(),
      };
      return operation.run(client, kwargs, args);
    };
  }) as SourceFunctions;

  return { ...source, ...sourceFunctions, _blurrMember: 'source' };
}
