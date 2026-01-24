import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSupabaseServerClient } from '$lib/supabase';
import { verifyRecaptcha } from '$lib/utils/recaptcha';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';

const SECRET_RECAPTCHA_SECRET_KEY = env.SECRET_RECAPTCHA_SECRET_KEY ?? '';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const { username, email, password, location, newsletterOptIn, recaptchaToken } =
		await request.json();

	// Validate required fields
	if (!username || !email || !password) {
		return json({ error: 'Missing required fields' }, { status: 400 });
	}

	// Validate username format
	if (!/^[a-zA-Z0-9_-]{3,30}$/.test(username)) {
		return json(
			{ error: 'Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens' },
			{ status: 400 }
		);
	}

	// Validate email format
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		return json({ error: 'Invalid email format' }, { status: 400 });
	}

	// Validate password strength
	if (password.length < 8) {
		return json({ error: 'Password must be at least 8 characters' }, { status: 400 });
	}

	// Verify reCAPTCHA (skip on localhost/dev)
	if (!dev) {
		if (!recaptchaToken) {
			return json({ error: 'reCAPTCHA verification required' }, { status: 400 });
		}

		const recaptchaResult = await verifyRecaptcha(recaptchaToken, SECRET_RECAPTCHA_SECRET_KEY, 'register');
		if (!recaptchaResult.valid) {
			const errorCodes = recaptchaResult.errorCodes || [];
			const errorInfo = errorCodes.join(', ') || `score: ${recaptchaResult.score ?? 'unknown'}`;
			return json({ error: `reCAPTCHA verification failed (${errorInfo}). Please try again.` }, { status: 400 });
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

	// Check if username is already taken
	const { data: existingProfile } = await supabase
		.from('profiles')
		.select('username')
		.ilike('username', username)
		.single();

	if (existingProfile) {
		return json({ error: 'Username is already taken' }, { status: 400 });
	}

	// Create the user
	const { data: authData, error: authError } = await supabase.auth.signUp({
		email,
		password,
		options: {
			data: {
				username,
				location: location || null,
				newsletter_opt_in: newsletterOptIn
			},
			emailRedirectTo: undefined // No email verification
		}
	});

	if (authError) {
		console.error('Auth error:', authError);

		if (authError.message.includes('already registered')) {
			return json({ error: 'An account with this email already exists' }, { status: 400 });
		}

		return json({ error: authError.message }, { status: 400 });
	}

	if (!authData.user) {
		return json({ error: 'Failed to create account' }, { status: 500 });
	}

	return json({
		success: true,
		user: {
			id: authData.user.id,
			email: authData.user.email
		}
	});
};
