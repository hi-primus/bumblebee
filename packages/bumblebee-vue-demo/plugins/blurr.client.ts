import { Blurr, Server } from 'blurr';

export default defineNuxtPlugin(() => {
  return {
    provide: {
      blurr: { Blurr, Server }
    }
  };
});
