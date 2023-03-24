import { Blurr, Server } from '@hi-primus/blurr';

export default function () {
  const nuxtApp = useNuxtApp();
  return nuxtApp.$blurr as { Blurr: typeof Blurr; Server: typeof Server };
}
