import { Blurr, Server } from '@hi-primus/blurr';

export default defineNuxtPlugin(() => {
  return {
    provide: {
      blurr: { Blurr, Server }
    }
  };
});
