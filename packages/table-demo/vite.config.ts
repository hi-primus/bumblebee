import { defineConfig } from 'vite';

import plainText from 'vite-plugin-plain-text';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [
    sveltekit(),
    plainText.default(/\.py$/),
  ],
});
