import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const { username, email, password, location, newsletterOptIn } =
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

	if (!locals.supabase) {
		return json({ error: 'Authentication service not configured' }, { status: 503 });
	}

	// Check if username is already taken
	const { data: existingProfile } = await locals.supabase
		.from('profiles')
		.select('username')
		.ilike('username', username)
		.single();

	if (existingProfile) {
		return json({ error: 'Username is already taken' }, { status: 400 });
	}

	// Create the user
	const { data: authData, error: authError } = await locals.supabase.auth.signUp({
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
