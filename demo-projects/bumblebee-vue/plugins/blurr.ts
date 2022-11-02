import { BlurrClient, BlurrServer } from 'blurr';

export default defineNuxtPlugin((nuxtApp) => {
  console.log({BlurrClient, BlurrServer})
  return {
    provide: {
      blurr: { BlurrClient, BlurrServer }
    },
  };
});