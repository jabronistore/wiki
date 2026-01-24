<script lang="ts" module>
	// Global type declaration for grecaptcha
	declare global {
		interface Window {
			grecaptcha: {
				ready: (callback: () => void) => void;
				execute: (siteKey: string, options: { action: string }) => Promise<string>;
			};
		}
	}
</script>

<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { env } from '$env/dynamic/public';

	const PUBLIC_RECAPTCHA_SITE_KEY = env.PUBLIC_RECAPTCHA_SITE_KEY ?? '';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	let recaptchaLoaded = $state(false);

	onMount(() => {
		// Check if already loaded
		if (window.grecaptcha) {
			recaptchaLoaded = true;
			return;
		}

		const script = document.createElement('script');
		script.src = `https://www.google.com/recaptcha/api.js?render=${PUBLIC_RECAPTCHA_SITE_KEY}`;
		script.async = true;
		script.defer = true;

		script.onload = () => {
			recaptchaLoaded = true;
		};

		document.head.appendChild(script);
	});
</script>

{@render children()}
