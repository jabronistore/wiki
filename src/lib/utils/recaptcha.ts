import { env } from '$env/dynamic/public';
import { browser } from '$app/environment';

const PUBLIC_RECAPTCHA_SITE_KEY = env.PUBLIC_RECAPTCHA_SITE_KEY ?? '';

// Global type declaration for grecaptcha
declare global {
	interface Window {
		grecaptcha: {
			ready: (callback: () => void) => void;
			execute: (siteKey: string, options: { action: string }) => Promise<string>;
		};
	}
}

let recaptchaLoaded = false;
let loadPromise: Promise<void> | null = null;

/**
 * Load the reCAPTCHA script if not already loaded
 */
export function loadRecaptcha(): Promise<void> {
	if (!browser) return Promise.resolve();

	if (recaptchaLoaded) return Promise.resolve();

	if (loadPromise) return loadPromise;

	loadPromise = new Promise((resolve) => {
		if (window.grecaptcha) {
			recaptchaLoaded = true;
			resolve();
			return;
		}

		const script = document.createElement('script');
		script.src = `https://www.google.com/recaptcha/api.js?render=${PUBLIC_RECAPTCHA_SITE_KEY}`;
		script.async = true;
		script.defer = true;

		script.onload = () => {
			recaptchaLoaded = true;
			resolve();
		};

		document.head.appendChild(script);
	});

	return loadPromise;
}

/**
 * Execute reCAPTCHA v3 and get a token
 */
export async function executeRecaptcha(action: string): Promise<string> {
	if (!browser) throw new Error('reCAPTCHA can only be executed in the browser');

	await loadRecaptcha();

	if (!window.grecaptcha) {
		throw new Error('reCAPTCHA not loaded');
	}

	return new Promise((resolve, reject) => {
		window.grecaptcha.ready(() => {
			window.grecaptcha.execute(PUBLIC_RECAPTCHA_SITE_KEY, { action }).then(resolve).catch(reject);
		});
	});
}

/**
 * Verify reCAPTCHA token on the server
 */
export async function verifyRecaptcha(
	token: string,
	secretKey: string,
	expectedAction?: string
): Promise<{ valid: boolean; score?: number; errorCodes?: string[] }> {
	const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: new URLSearchParams({
			secret: secretKey,
			response: token
		})
	});

	const data = await response.json();
	console.log('reCAPTCHA response:', JSON.stringify(data, null, 2));

	// Check for errors first
	if (!data.success) {
		const errorCodes = data['error-codes'] || [];
		console.error('reCAPTCHA validation failed:', errorCodes);
		return { valid: false, score: data.score, errorCodes };
	}

	// Score threshold is 0.5 (minimum for allowing the request)
	if (data.score < 0.5) {
		console.error('reCAPTCHA score too low:', data.score);
		return { valid: false, score: data.score };
	}

	// Verify action matches expected action
	if (expectedAction && data.action !== expectedAction) {
		console.error('reCAPTCHA action mismatch:', data.action, '!==', expectedAction);
		return { valid: false, score: data.score };
	}

	return { valid: true, score: data.score };
}
