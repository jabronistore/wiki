import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import path from 'path';

/** @type {import('mdsvex').MdsvexOptions} */
const mdsvexOptions = {
	extensions: ['.md']
};

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.md'],
	preprocess: [vitePreprocess(), mdsvex(mdsvexOptions)],

	kit: {
		adapter: adapter({
			routes: {
				include: ['/*'],
				exclude: ['<build>', '<prerendered>', '/peptides/*']
			}
		}),
		alias: {
			$lib: path.resolve('./src/lib'),
			$data: path.resolve('./data')
		},
		prerender: {
			handleHttpError: 'warn'
		}
	}
};

export default config;
