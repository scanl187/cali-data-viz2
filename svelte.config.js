import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			pages: 'build',       // output folder for GitHub Pages
			assets: 'build',
			fallback: '404.html'  // ensures /story works
		}),
		paths: {
			base: process.argv.includes('dev') ? '' : '/cali-data-viz2' // your fork repo name
		}
	}
};

export default config;