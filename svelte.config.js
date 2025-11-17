import adapter from '@sveltejs/adapter-netlify';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter(),
    // Remove paths.base if you had it before; Netlify handles routing automatically
  }
};

export default config;
