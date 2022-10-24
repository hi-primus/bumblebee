/*
 * Generates a unique variable name using a prefix
 */

import ShortUniqueId from 'short-unique-id';

export function generateUniqueVariableName(prefix = '') {
  return prefix + new ShortUniqueId({ length: 8 });
}

/**
 * Checks if passed value is an object
 * @param value
 * @returns
 */

export function isObject(
  value: unknown
): value is Record<string | number | symbol, unknown> {
  return value && typeof value === 'object';
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
  }, {});
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
