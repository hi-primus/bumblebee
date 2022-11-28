import { Blurr, Server } from 'blurr';

export default defineNuxtPlugin(nuxtApp => {
  console.log({ Blurr, Server });
  return {
    provide: {
      blurr: { Blurr, Server }
    }
  };
});
