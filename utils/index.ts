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

export const transpose = <T>(a: T[][]): T[][] => {
  return Object.keys(a[0]).map((c: string) => {
    return a.map(r=>r[Number(c)]);
  });
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

export const compareObjects = (
  a: unknown,
  b: unknown,
  excludeProperties: string[] = []
): boolean => {
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

  excludeProperties.forEach(prop => {
    const aIndex = aKeys.indexOf(prop);
    if (aIndex !== -1) {
      aKeys.splice(aIndex, 1);
    }
    const bIndex = bKeys.indexOf(prop);
    if (bIndex !== -1) {
      bKeys.splice(bIndex, 1);
    }
  });

  if (aKeys.length !== bKeys.length) {
    return false;
  }
  return aKeys.every(key => {
    let isEqual = false;
    if (Array.isArray(a[key]) && Array.isArray(b[key])) {
      isEqual = compareArrays(a[key] as unknown[], b[key] as unknown[]);
    } else if (isObject(a[key]) && isObject(b[key])) {
      isEqual = compareObjects(a[key], b[key], excludeProperties);
    } else {
      isEqual = a[key] === b[key];
    }
    return key in b && isEqual;
  });
};

export const compareArrays = (
  a: unknown[],
  b: unknown[],
  excludeProperties: string[] = []
): boolean => {
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
    return compareObjects(value, b[index], excludeProperties);
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

export const getUniqueName = (
  name: string,
  names: string[],
  parentheses = false
): string => {
  if (!names.includes(name)) {
    return name;
  }

  const lastMatchingName = names
    .filter(n =>
      n.match(
        new RegExp(parentheses ? `^${name} \\((\\d+)\\)$` : `^${name}(\\d+)$`)
      )
    )
    .sort()
    .pop();

  let index = 2;

  if (lastMatchingName) {
    if (parentheses) {
      index = Number(lastMatchingName.match(/\((\d+)\)/)?.[1]) + 1;
    } else {
      index = Number(lastMatchingName.match(/(\d+)$/)?.[1]) + 1;
    }
  }

  return parentheses ? `${name} (${index})` : `${name}${index}`;
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

export const copyToClipboard = (text: string) => {
  if (process.client) {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    const selected =
      (document.getSelection()?.rangeCount || 0) > 0
        ? document.getSelection()?.getRangeAt(0)
        : false;
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    if (selected) {
      document.getSelection()?.removeAllRanges();
      document.getSelection()?.addRange(selected);
    }
  }
};
