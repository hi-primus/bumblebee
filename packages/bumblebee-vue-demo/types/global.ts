import { Client } from 'blurr/build/main/types';

export {};

declare global {
  type ArrayOr<T> = T | T[];
  type ObjectValues<T> = T[keyof T];
  type SomeRequired<T, F extends keyof T> = T & Required<Pick<T, F>>;
  type BasicType = string | number | boolean | null | undefined;
  type Arguments<T> = T extends (...args: infer A) => unknown ? A : never;
  interface Window {
    blurr: Client;
  }
}
