import ShortUniqueId from 'short-unique-id';

import type { Name } from '../types/arguments';
import type { OperationArgument } from '../types/operation';

export const RELATIVE_ERROR = 10_000;
/*
 * Generates a unique variable name using a prefix
 */

const uid = new ShortUniqueId({ length: 8 });

export function generateUniqueVariableName(prefix = '') {
  return prefix + uid.sequentialUUID();
}

/**
 * Checks if passed value is an object
 * @param value
 * @returns
 */

export function isObject(
  value: unknown
): value is Record<string | number | symbol, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function isPromiseLike(value: unknown): value is Promise<unknown> {
  if (!value || typeof value !== 'object') {
    return false;
  }
  return 'then' in value && typeof value['then'] === 'function';
}

export function isStringRecord(
  value: unknown
): value is Record<string | number | symbol, unknown> {
  if (!value || typeof value !== 'object') {
    return false;
  }
  return (
    !Array.isArray(value) &&
    Object.keys(value).every((key) => typeof key === 'string')
  );
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

export function Name(name: string): Name {
  const _name = {} as Name;
  _name.name = name;
  _name.toString = () => _name.name;
  _name._blurrMember = 'name';
  return _name;
}

export function isName(value: unknown): value is Name {
  return (
    isObject(value) && '_blurrMember' in value && value._blurrMember == 'name'
  );
}

export function optionalPromise<T>(
  result: unknown,
  callback: (r: typeof result) => T
): PromiseOr<ReturnType<typeof callback>> {
  if (isPromiseLike(result)) {
    return result.then((r) => callback(r));
  } else {
    return callback(result);
  }
}

/**
 * Applies a callback 'cb' to every value in an object
 * @param object
 * @param cb
 * @returns Mapped object
 */

export function objectMap<T, V, K extends string | number | symbol>(
  object: Record<K, T>,
  cb: (value: T) => V
): Record<K, V> {
  if (isObject(object) && typeof cb === 'function') {
    return (Object.keys(object) as K[]).reduce((acc, key) => {
      acc[key] = cb(object[key]);
      return acc;
    }, {} as Record<K, V>);
  }
  return object as never;
}

/*
 * Filters an object's properties based on a callback
 * @param object
 * @param cb
 * @returns Filtered object
 */

export function objectFilter<T, U extends T[keyof T]>(
  object: T,
  cb: (elem: U, key: keyof T, object: T) => boolean
) {
  if (!object || typeof object !== 'object') {
    return object;
  }
  type OutputType = { [key in keyof T]: U };
  return (Object.keys(object) as (keyof T)[]).reduce(function (result, key) {
    if (cb(object[key] as U, key as keyof T, object)) {
      result[key] = object[key] as U;
    }
    return result;
  }, {} as OutputType);
}

/*
 * Loads a script to the DOM, used to workaround pyodide issues
 */

export function loadScript(url: string) {
  return new Promise((resolve) => {
    try {
      const document = globalThis?.document;
      if (!document) {
        console.error('Script not loaded. No DOM available.');
        resolve(false);
        return;
      }
      const scriptTag = document.createElement('script');
      scriptTag.src = url;
      document.body.appendChild(scriptTag);
      scriptTag.onload = resolve;
    } catch (error) {
      console.error('Script not loaded.', error);
      resolve(false);
    }
  });
}

export const camelToSnake = (value: string): string => {
  return value
    .replace(/([A-Z])/g, (match) => `_${match.toLowerCase()}`)
    .replace(/^_/, '');
};

const argName = (arg: OperationArgument) => {
  return arg.argName || camelToSnake(arg.name);
};

export const adaptKwargs = (
  args: InputArgs,
  operationArgs: OperationArgument[] | null
): Record<string, OperationCompatible> => {
  // no defaults to apply
  if (!operationArgs) {
    if (isObject(args)) {
      return args;
    }
    console.warn(
      '🛼 Trying to adapt positional arguments without default arguments defined',
      args
    );
    return {};
  }

  // positional arguments
  if (Array.isArray(args)) {
    return operationArgs.reduce((acc, arg, index) => {
      acc[argName(arg)] = args[index] === undefined ? arg.default : args[index];
      return acc;
    }, {} as Record<string, OperationCompatible>);
  }

  // named arguments

  type NamedArguments = Record<string, OperationCompatible>;

  const argsWithDefaults = operationArgs.reduce((acc, arg) => {
    const pythonArgName = argName(arg);
    const argValue = args[arg.name] || args[pythonArgName];
    if (argValue !== undefined) {
      acc[pythonArgName] = argValue;
    } else if (arg.default !== undefined) {
      acc[pythonArgName] = arg.default;
    }
    return acc;
  }, {} as NamedArguments);

  // include extra arguments
  return {
    ...argsWithDefaults,
    ...objectFilter(
      args,
      (_value, key) =>
        argsWithDefaults[key] === undefined &&
        argsWithDefaults[camelToSnake(key)] === undefined
    ),
  };
};

export const pythonString = (param: PythonCompatible): string => {
  switch (typeof param) {
    case 'string':
    case 'number':
      return JSON.stringify(param);
    case 'boolean':
      return param ? 'True' : 'False';
    case 'object':
      if (isName(param)) {
        return param.name || param.toString();
      } else if (Array.isArray(param)) {
        return '[' + param.map((p) => pythonString(p)).join(', ') + ']';
      } else if (isObject(param)) {
        return (
          '{' +
          Object.keys(param)
            .map((k) => `"${k}": ${pythonString(param[k] as PythonCompatible)}`)
            .join(', ') +
          '}'
        );
      } else {
        return 'None';
      }
    default:
      return 'None';
  }
};

export const pythonArguments = (
  params: Record<string, PythonCompatible>
): string => {
  const _params = { ...params };
  if ('source' in _params) {
    delete _params.source;
  }
  if ('target' in _params) {
    delete _params.target;
  }
  const codes = [];
  for (const key in _params) {
    if (_params[key] !== undefined) {
      const param = pythonString(_params[key]);
      codes.push(`${key}=${param}`);
    }
  }

  return codes.join(', ');
};
