<template>
  <NuxtLayout
    class="w-full max-w-xs min-h-screen py-2 mx-auto flex flex-col items-center justify-center"
  >
    <form
      class="bg-white shadow-md rounded border border-line-light px-8 py-6 mb-4 mx-auto"
      @submit.prevent="onLogin"
    >
      <div class="mb-4">
        <AppInput ref="emailInput" v-model="email" label="Email" type="text" />
        <!-- TODO: add validation -->
        <!-- :rules="[
            () => (errorMessage === emailErrorMessage ? errorMessage : true)
          ]"
          @update:model-value="
            errorMessage === emailErrorMessage ? (errorMessage = null) : null
          " -->
      </div>
      <div class="mb-6">
        <AppInput
          id="password"
          v-model="password"
          label="Password"
          type="password"
        />
      </div>
      <div class="flex items-center justify-between">
        <AppButton type="submit"> Sign In </AppButton>
        <AppButton class="layout-invisible" to="#">
          Forgot Password?
        </AppButton>
      </div>
    </form>
  </NuxtLayout>
</template>
<script setup>
const email = ref('');
const password = ref('');

const emailInput = ref(null);

const { signInEmailPassword, isError, error } = useSignInEmailPassword();

const emailErrorMessage = 'Invalid email format';

const errorMessage = ref(null);

watch(error, () => {
  if (error.value.status === 10) {
    errorMessage.value = emailErrorMessage;
    // await nextTick();
    // emailInput.value.validate(false);
  } else if (error.value.status === 401) {
    errorMessage.value = 'Wrong email or password';
  } else {
    errorMessage.value = null;
  }
});

const onLogin = async () => {
  const result = await signInEmailPassword(email, password);
  console.log('[DEBUG] login result', result);
  if (isError.value) {
    console.error(error.value);
    return;
  }
  await navigateTo('/projects');
};
</script>
