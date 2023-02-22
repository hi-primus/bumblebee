/* eslint-disable @typescript-eslint/ban-types */
import { Client } from 'blurr/build/main/types';

export {};

declare global {
  type PromiseOr<T> = T | Promise<T>;
  type ArrayOr<T> = T | T[];
  type ObjectValues<T> = T[keyof T];
  type SomeRequired<T, F extends keyof T> = T & Required<Pick<T, F>>;
  type Prettify<T> = { [K in keyof T]: T[K] } & {};
  type BasicType = string | number | boolean | null | undefined;
  type Arguments<T> = T extends (...args: infer A) => unknown ? A : never;
  interface Window {
    blurr: Client;
  }
}
