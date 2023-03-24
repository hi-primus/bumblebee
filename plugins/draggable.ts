import draggable from 'vuedraggable';

export default defineNuxtPlugin(nuxtApp => {
  return nuxtApp.vueApp.component('draggable', draggable);
});
