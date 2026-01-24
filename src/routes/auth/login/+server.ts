import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const { email, password } = await request.json();

	// Validate required fields
	if (!email || !password) {
		return json({ error: 'Email and password are required' }, { status: 400 });
	}

	if (!locals.supabase) {
		return json({ error: 'Authentication service not configured' }, { status: 503 });
	}

	// Sign in the user
	const { data: authData, error: authError } = await locals.supabase.auth.signInWithPassword({
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
