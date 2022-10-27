export {};

declare global {
  interface Window {
    run: (code: string) => any;
  }
}
