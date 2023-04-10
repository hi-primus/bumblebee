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

export const stepify = (a: number, b: number, f = Math.round): number => {
  return f(a / b) * b;
};

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

// string

export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const naturalJoin = (arr: string[]): string => {
  if (arr.length === 1) {
    return arr[0];
  }
  if (arr.length === 2) {
    return arr.join(' and ');
  }
  return (
    arr.slice(0, arr.length - 1).join(', ') + ' and ' + arr[arr.length - 1]
  );
};

export const getUniqueName = (name: string, names: string[]): string => {
  const lastMatchingName = names
    .filter(n => n.startsWith(`${name} (`))
    .sort()
    .pop();

  let index = 2;

  if (lastMatchingName) {
    index = Number(lastMatchingName.match(/\((\d+)\)/)?.[1]) + 1;
  }

  return `${name} (${index})`;
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
