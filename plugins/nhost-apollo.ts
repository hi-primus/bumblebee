import { createApolloClient } from '@nhost/apollo';
import { NhostClient } from '@nhost/vue';
import { DefaultApolloClient } from '@vue/apollo-composable';

export default defineNuxtPlugin(nuxtApp => {
  const runtimeConfig = useRuntimeConfig();
  const nhost = new NhostClient({
    region: runtimeConfig.public.nhostRegion,
    subdomain: runtimeConfig.public.nhostSubdomain,
    clientStorageType: 'web'
  });
  const apolloClient = createApolloClient({
    nhost
  });

  const router = useRouter();

  router.beforeEach(async to => {
    if (to.path === '/') {
      return '/login';
    }

    if (!process.client) {
      return true;
    }

    const isAuthenticated = await nhost.auth.isAuthenticatedAsync();

    if (
      !isAuthenticated &&
      to.path !== '/login' &&
      to.path !== '/forgot-password' &&
      to.path !== '/change-password'
    ) {
      return '/login';
    }

    if (isAuthenticated && to.path === '/login') {
      return '/projects';
    }
    return true;
  });

  nuxtApp.vueApp.use(nhost).provide(DefaultApolloClient, apolloClient);
});
