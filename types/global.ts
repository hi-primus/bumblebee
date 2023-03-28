/* eslint-disable @typescript-eslint/ban-types */
import type { Client } from './blurr';

export {};

interface R<T> {
  [key: number | string]: T;
}

declare global {
  type PromiseOr<T> = T | Promise<T>;
  type ArrayOr<T> = T | T[];
  type ObjectValues<T> = T[keyof T];
  type SomeRequired<T, F extends keyof T> = T & Required<Pick<T, F>>;
  type Prettify<T> = { [K in keyof T]: T[K] } & {};
  type BasicType = string | number | boolean | null | undefined;
  type CompatibleType = BasicType | CompatibleType[] | R<CompatibleType>;
  type Arguments<T> = T extends (...args: infer A) => unknown ? A : never;
  interface Window {
    blurr: Client;
  }
}
