import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      // '404.html' (NOT 'index.html') so the adapter does not overwrite the
      // server-rendered landing with the SPA shell: with fallback
      // 'index.html' the prerendered / was clobbered and crawlers got an
      // empty page. `serve -s` still returns index.html for unknown paths
      // (SPA routing for /room/*), and SvelteKit hydrates client-side.
      fallback: '404.html'
    }),
    alias: {
      '$lib': './src/lib',
      '$lib/*': './src/lib/*'
    }
  }
};

export default config;
