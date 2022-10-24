import { generateUniqueVariableName, isObject, objectMap } from '../../utils';
import { callOperation, getOperation } from '../operations';

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

export function Source(name?: string, client?: Client): Source {
  if (!client) {
    throw new Error('A source can only be initialized using a client');
  }
  if (!name) {
    name = generateUniqueVariableName('source');
  }

  const source: Source = {
    name,
    client,
    _blurrMember: 'source',
    toString: () => name,
  };

  return new Proxy(source, {
    get(source: Source, name: string) {
      const operation = name !== 'valueOf' && getOperation('dataframe', name);
      if (operation) {
        return (kwargs, args) => {
          kwargs = {
            ...(kwargs || {}),
            source: source.name,
          };
          return callOperation(source.client, operation, kwargs, args);
        };
      }
      return source[name];
    },
  });
}
