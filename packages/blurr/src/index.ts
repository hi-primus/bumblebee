import { Blurr as _Blurr } from './lib/client';
import { Source as _Source } from './lib/client/data/source';
import { Server as _Server } from './lib/server';

export { ClientOptions } from './types/client';
export { ServerOptions } from './types/server';
export { Client as ClientInterface } from './types/client';
export { Server as ServerInterface } from './types/server';
export { Source as SourceInterface } from './types/source';

export const Blurr = _Blurr;
export const Source = _Source;
export const Server = _Server;

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace globalThis {
  let blurr: {
    Blurr: typeof _Blurr;
    Source: typeof _Source;
    Server: typeof _Server;
  };
}

globalThis.blurr = { Blurr, Source, Server };

export default { Blurr, Source, Server };
