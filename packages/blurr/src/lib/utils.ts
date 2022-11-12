import ShortUniqueId from 'short-unique-id';

import { OperationArgument } from '../types/operation';

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
  return value && typeof value === 'object' && !Array.isArray(value);
}

export function isStringRecord(
  value: unknown
): value is Record<string | number | symbol, unknown> {
  return (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).every((key) => typeof key === 'string')
  );
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

/**
 * Applies a callback 'cb' to every value in an object
 * @param object
 * @param cb
 * @returns Mapped object
 */

export function objectMap<T, U extends T[keyof T], V>(
  object: T,
  cb: (elem: U) => V
) {
  return Object.keys(object).reduce(function (result, key) {
    result[key] = cb(object[key]);
    return result;
  }, {} as { [key in keyof T]: V });
}

/*
 * Loads a script to the DOM, used to workaround pyodide issues
 */

export function loadScript(url: string) {
  return new Promise((resolve) => {
    try {
      const document = globalThis?.document;
      if (!document) {
        console.error('Script not loaded. No DOM available');
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

export const adaptKwargs = (
  args: InputArgs,
  operationArgs: OperationArgument[] | null
): Record<string, OperationCompatible> => {
  // no defaults to apply
  if (!operationArgs) {
    return (isObject(args) ? args : {}) as Record<string, OperationCompatible>;
  }

  // positional arguments
  if (Array.isArray(args)) {
    return operationArgs.reduce((acc, arg, index) => {
      acc[arg.name] = args[index] === undefined ? arg.default : args[index];
      return acc;
    }, {} as Record<string, OperationCompatible>);
  }

  // named arguments
  const argsWithDefaults = operationArgs.reduce((acc, arg) => {
    if (args[arg.name] !== undefined) {
      acc[arg.name] = args[arg.name];
    } else if (arg.default !== undefined) {
      acc[arg.name] = arg.default;
    }
    return acc;
  }, {});

  // include extra arguments
  return {
    ...argsWithDefaults,
    ...args,
  };
};

export const pythonArguments = (params: Record<string, PythonCompatible>) => {
  const _params = { ...params };
  if ('source' in _params) {
    delete _params.source;
  }
  const codes = [];
  for (const key in _params) {
    const param = _params[key];
    codes.push(`${key}=${JSON.stringify(param)}`);
  }

  return codes.join(', ');
};
