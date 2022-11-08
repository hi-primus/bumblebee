export {};

declare global {
  type ObjectValues<T> = T[keyof T];
}
