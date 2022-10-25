import { generateUniqueVariableName, isObject, objectMap } from '../../utils';
import { operations } from '../operations/dataframe';

export function removeSource(value: OperationCompatible) {
  if (isSource(value)) {
    return value.name;
  } else if (Array.isArray(value)) {
    return value.map(removeSource);
  } else if (isObject(value)) {
    return objectMap(value, removeSource);
  } else {
    return value;
  }
}

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

  for (const key in operations) {
    source[key as keyof typeof operations] = (kwargs, args) => {
      kwargs = {
        ...(kwargs || {}),
        source: source.name,
      };
      return operations[key].run(client, kwargs, args);
    };
  }

  const sourceFunctions = objectMap(operations, (operation) => {
    return (kwargs, args) => {
      kwargs = {
        ...(kwargs || {}),
        source: source.name,
      };
      return operation.run(client, kwargs, args);
    };
  }) as SourceFunctions;

  return { ...source, ...sourceFunctions, _blurrMember: 'source' };
}
