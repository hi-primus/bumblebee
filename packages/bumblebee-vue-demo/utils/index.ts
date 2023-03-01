import { isObject } from '../types/common';

export const getNameFromFileName = (name: string): string => {
  name = name.split('/').pop() || '';
  name = name.split('\\').pop() || '';
  const parts = name.split('.');
  if (parts.length === 1) {
    name = parts[0];
  } else {
    name = parts.slice(0, parts.length - 1).join('.');
  }
  name = name.split('?')[0];
  const noSymbolsName = name.replace(/[^a-zA-Z0-9]/g, ' ').trim();
  if (noSymbolsName.length > 0) {
    name = noSymbolsName;
  } else {
    name = name.trim();
  }
  name = name.charAt(0).toUpperCase() + name.slice(1);

  const extension = parts.pop()?.toUpperCase();

  return name || (extension ? `${extension} file` : '');
};

export const throttle = <T extends Array<unknown>>(
  func: (...args: T) => unknown,
  limit: number | ((...args: Arguments<typeof func>) => number)
): typeof func => {
  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-this-alias */
  let lastFunc: ReturnType<typeof setTimeout>;
  let lastRan: any;
  return function (...args: T) {
    const context = this;
    limit = typeof limit === 'function' ? limit.apply(context, args) : limit;

    if (!lastRan) {
      func.apply(context, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(function () {
        if (Date.now() - lastRan >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
};

export const throttleOnce = (
  func: (...args: unknown[]) => Promise<unknown>,
  options: {
    limit?: number | ((...args: Arguments<typeof func>) => number);
    delay?: number | ((...args: Arguments<typeof func>) => number);
    cancelable?: boolean | ((...args: Arguments<typeof func>) => boolean);
  } = {}
): typeof func => {
  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-this-alias */
  const defaultLimit = options.limit === undefined ? 1000 : options.limit;
  const defaultDelay = options.delay === undefined ? 0 : options.delay;
  const defaultCancelable =
    options.cancelable === undefined ? false : options.cancelable;

  let lastFunc: ReturnType<typeof setTimeout>;
  let lastRan: any;

  let promise: Promise<unknown> | null = null;
  let cancel: ((reason?: any) => void) | null = null;

  return async function (...args: unknown[]) {
    const context = this;

    const limit =
      typeof defaultLimit === 'function'
        ? defaultLimit.apply(context, args)
        : (defaultLimit as number);

    const delay =
      typeof defaultDelay === 'function'
        ? defaultDelay.apply(context, args)
        : (defaultDelay as number);

    const cancelable =
      typeof defaultCancelable === 'function'
        ? defaultCancelable.apply(context, args)
        : (defaultCancelable as boolean);

    if (promise) {
      if (cancelable) {
        cancel && cancel();
        cancel = null;
        await promise;
        promise = null;
      } else {
        await promise;
        promise = null;
        return;
      }
    }

    if (!lastRan) {
      lastRan = Date.now() - limit;
    }

    clearTimeout(lastFunc);
    promise = new Promise((resolve, reject) => {
      cancel = () => resolve(new Error('Canceled'));
      lastFunc = setTimeout(function () {
        if (Date.now() - lastRan >= limit) {
          setTimeout(function () {
            func
              .apply(context, args)
              .then(result => {
                resolve(result);
              })
              .catch(error => {
                reject(error);
              });
          }, delay);
        }
      }, limit - (Date.now() - lastRan));
    });
    try {
      const result = await promise;
      promise = null;
      lastRan = Date.now();
      return result;
    } catch (error) {
      promise = null;
      lastRan = Date.now();
      throw error;
    }
  };
};

export const stepify = (a: number, b: number, f = Math.round): number => {
  return f(a / b) * b;
};

export const objectMap = <T>(
  obj: Record<string | number | symbol, T>,
  cb: (value: T) => T
) => {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, cb(value)])
  );
};

export const compareObjects = (a: unknown, b: unknown): boolean => {
  if (a === b) {
    return true;
  }
  if (typeof a !== typeof b) {
    return false;
  }
  if (!isObject(a) || !isObject(b)) {
    return false;
  }
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) {
    return false;
  }
  return aKeys.every(key => {
    return key in b && compareObjects(a[key], b[key]);
  });
};

export const compareArrays = (a: unknown[], b: unknown[]): boolean => {
  if (a === b) {
    return true;
  }
  if (!Array.isArray(a) || !Array.isArray(b)) {
    return false;
  }
  if (a?.length !== b?.length) {
    return false;
  }
  return a.every((value, index) => {
    return compareObjects(value, b[index]);
  });
};

export const deepClone = <T>(obj: T): T => {
  if (Array.isArray(obj)) {
    return (obj as any[]).map(deepClone) as T;
  }
  if (obj instanceof File) {
    return obj;
  }
  if (isObject(obj)) {
    const clone = {} as T;
    for (const key in obj) {
      (clone as any)[key] = deepClone(obj[key]);
    }
    return clone;
  }
  return obj;
};

// HTML

export const focusNext = (el: HTMLElement): HTMLElement | null => {
  el = el.nextElementSibling as HTMLElement;

  if (el) {
    while (el && el.tabIndex !== 0) {
      el = el.nextElementSibling as HTMLElement;
    }
    if (el) {
      el.focus();
      return el;
    }
  }
  return null;
};

export const focusPrevious = (el: HTMLElement): HTMLElement | null => {
  el = el.previousElementSibling as HTMLElement;

  if (el) {
    while (el && el.tabIndex !== 0) {
      el = el.previousElementSibling as HTMLElement;
    }
    if (el) {
      el.focus();
      return el;
    }
  }
  return null;
};

// errors

export class PreviewError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'PreviewError';
  }
}

export const isPreviewError = (error: Error): error is PreviewError => {
  return error.name === 'PreviewError';
};
