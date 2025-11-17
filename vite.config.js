import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
// import cesium from 'vite-plugin-cesium';


export default defineConfig({
	base: '/cali-data-viz2/',   // your fork repo name
	plugins: [sveltekit()]
});