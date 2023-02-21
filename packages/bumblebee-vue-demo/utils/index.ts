import { isObject } from '@/types/common';

export const throttle = (
  func: (...args: unknown[]) => unknown,
  limit: number | ((...args: Arguments<typeof func>) => number)
): typeof func => {
  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-this-alias */
  let lastFunc: ReturnType<typeof setTimeout>;
  let lastRan: any;
  return function (...args: unknown[]) {
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
  limit: number | ((...args: Arguments<typeof func>) => number)
): typeof func => {
  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-this-alias */
  let lastFunc: ReturnType<typeof setTimeout>;
  let lastRan: any;

  let promise: Promise<unknown> | null = null;

  return async function (...args: unknown[]) {
    const context = this;
    limit = typeof limit === 'function' ? limit.apply(context, args) : limit;

    if (promise) {
      await promise;
      promise = null;
      return;
    }

    if (!lastRan) {
      promise = func.apply(context, args);
      await promise;
      promise = null;
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(async function () {
        if (Date.now() - lastRan >= limit) {
          promise = func.apply(context, args);
          await promise;
          promise = null;
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
};

export const stepify = (a: number, b: number, f = Math.round): number => {
  return f(a / b) * b;
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
