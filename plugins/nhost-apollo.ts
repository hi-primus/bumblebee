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
    const isAuthenticated = await nhost.auth.isAuthenticatedAsync();

    if (!process.client) {
      return true;
    }

    if (
      !isAuthenticated &&
      to.path !== '/login' &&
      to.path !== '/forgot-password' &&
      to.path !== '/change-password'
    ) {
      return '/login';
    }
    return true;
  });

  nuxtApp.vueApp.use(nhost).provide(DefaultApolloClient, apolloClient);
});
