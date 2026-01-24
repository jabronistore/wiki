import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSupabaseServerClient } from '$lib/supabase';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const supabase = createSupabaseServerClient({
		getAll: () => cookies.getAll(),
		setAll: (cookiesToSet) => {
			cookiesToSet.forEach(({ name, value, options }) => {
				cookies.set(name, value, { path: '/', ...options });
			});
		}
	});

	if (!supabase) {
		return json({ error: 'Database not configured' }, { status: 503 });
	}

	// Check authentication using getUser() for secure server-side auth
	const {
		data: { user },
		error: authError
	} = await supabase.auth.getUser();

	if (authError || !user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	const body = await request.json();
	const { discussionId } = body;

	if (!discussionId) {
		return json({ error: 'Discussion ID required' }, { status: 400 });
	}

	try {
		// Insert upvote - the trigger will handle incrementing the count
		const { error: insertError } = await supabase.from('discussion_upvotes').insert({
			user_id: user.id,
			discussion_id: discussionId
		});

		if (insertError) {
			// If it's a unique constraint violation, that's expected
			if (insertError.code === '23505') {
				return json({ error: 'Already upvoted' }, { status: 400 });
			}
			console.error('Upvote insert error:', insertError);
			return json({ error: 'Failed to upvote' }, { status: 500 });
		}

		return json({ success: true });
	} catch (error) {
		console.error('Unexpected error:', error);
		return json({ error: 'An unexpected error occurred' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ request, cookies }) => {
	const supabase = createSupabaseServerClient({
		getAll: () => cookies.getAll(),
		setAll: (cookiesToSet) => {
			cookiesToSet.forEach(({ name, value, options }) => {
				cookies.set(name, value, { path: '/', ...options });
			});
		}
	});

	if (!supabase) {
		return json({ error: 'Database not configured' }, { status: 503 });
	}

	// Check authentication using getUser() for secure server-side auth
	const {
		data: { user },
		error: authError
	} = await supabase.auth.getUser();

	if (authError || !user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	const body = await request.json();
	const { discussionId } = body;

	if (!discussionId) {
		return json({ error: 'Discussion ID required' }, { status: 400 });
	}

	try {
		// Delete upvote - the trigger will handle decrementing the count
		const { error: deleteError } = await supabase
			.from('discussion_upvotes')
			.delete()
			.eq('user_id', user.id)
			.eq('discussion_id', discussionId);

		if (deleteError) {
			console.error('Upvote delete error:', deleteError);
			return json({ error: 'Failed to remove upvote' }, { status: 500 });
		}

		return json({ success: true });
	} catch (error) {
		console.error('Unexpected error:', error);
		return json({ error: 'An unexpected error occurred' }, { status: 500 });
	}
};
