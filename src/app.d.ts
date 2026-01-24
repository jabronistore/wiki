// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		interface Error {
			message: string;
			sensorId?: string;
			sensorName?: string;
			indexId?: string;
			indexName?: string;
			validIndices?: string[];
		}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

declare module '$env/static/public' {
	export const PUBLIC_RECAPTCHA_SITE_KEY: string;
}

export {};
