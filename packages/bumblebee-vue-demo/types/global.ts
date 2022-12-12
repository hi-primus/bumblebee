import { Client } from 'blurr/build/main/types';

export {};

declare global {
  type ObjectValues<T> = T[keyof T];
  type SomeRequired<T, F extends keyof T> = T & Required<Pick<T, F>>;
  type BasicType = string | number | boolean | null | undefined;
  interface Window {
    blurr: Client;
  }
}
