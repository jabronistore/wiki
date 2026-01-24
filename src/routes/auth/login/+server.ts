import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSupabaseServerClient } from '$lib/supabase';
import { verifyRecaptcha } from '$lib/utils/recaptcha';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';

const SECRET_RECAPTCHA_SECRET_KEY = env.SECRET_RECAPTCHA_SECRET_KEY ?? '';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const { email, password, recaptchaToken } = await request.json();

	// Validate required fields
	if (!email || !password) {
		return json({ error: 'Email and password are required' }, { status: 400 });
	}

	// Verify reCAPTCHA (skip on localhost/dev)
	if (!dev) {
		if (!recaptchaToken) {
			return json({ error: 'reCAPTCHA verification required' }, { status: 400 });
		}

		const recaptchaResult = await verifyRecaptcha(recaptchaToken, SECRET_RECAPTCHA_SECRET_KEY, 'login');
		if (!recaptchaResult.valid) {
			return json({ error: 'reCAPTCHA verification failed. Please try again.' }, { status: 400 });
		}
	}

	// Create Supabase client
	const supabase = createSupabaseServerClient({
		getAll: () => cookies.getAll(),
		setAll: (cookiesToSet) => {
			cookiesToSet.forEach(({ name, value, options }) => {
				cookies.set(name, value, { path: '/', ...options });
			});
		}
	});

	// Sign in the user
	const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
		email,
		password
	});

	if (authError) {
		console.error('Auth error:', authError);

		if (authError.message.includes('Invalid login credentials')) {
			return json({ error: 'Invalid email or password' }, { status: 401 });
		}

		return json({ error: authError.message }, { status: 400 });
	}

	if (!authData.user) {
		return json({ error: 'Login failed' }, { status: 500 });
	}

	return json({
		success: true,
		user: {
			id: authData.user.id,
			email: authData.user.email
		}
	});
};
