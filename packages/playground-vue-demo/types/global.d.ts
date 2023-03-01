import { Blurr as BlurrClient, Source as BlurrSource } from 'blurr';

export {}

declare global {
  type Client = ReturnType<typeof BlurrClient>;
  type Source = ReturnType<typeof BlurrSource>;
  interface Window {
    blurr: Client;
  }
}
