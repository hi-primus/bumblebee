import { Client } from 'blurr/build/main/types';

export {};

declare global {
  type ObjectValues<T> = T[keyof T];
  type SomeRequired<T, F extends keyof T> = T & Required<Pick<T, F>>;
  interface Window {
    blurr: Client;
  }
}
