import { Blurr as _Blurr } from './lib/client';
import { Source as _Source } from './lib/client/data/source';
import { Server as _Server } from './lib/server';

export const Blurr = _Blurr;
export const Source = _Source;
export const Server = _Server;

globalThis.blurr = { Blurr, Source, Server };

export default { Blurr, Source, Server };
