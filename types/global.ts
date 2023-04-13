/* eslint-disable @typescript-eslint/ban-types */
import type { Client } from './blurr';

export {};

declare global {
  type PromiseOr<T> = T | Promise<T>;
  type ArrayOr<T> = T | T[];
  type ObjectValues<T> = T[keyof T];
  type SomeRequired<T, F extends keyof T> = T & Required<Pick<T, F>>;
  type Prettify<T> = { [K in keyof T]: T[K] } & {};
  type Dictionary<T> = Record<string, T>;
  type BasicType = string | number | boolean | null | undefined;
  type CompatibleType = BasicType | Array<BasicType> | Dictionary<BasicType>;
  type Arguments<T> = T extends (...args: infer A) => unknown ? A : never;
  interface Window {
    blurr: Client;
  }
}
