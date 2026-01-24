import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSupabaseServerClient } from '$lib/supabase';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const supabase = createSupabaseServerClient({
		getAll: () => cookies.getAll(),
		setAll: (cookiesToSet) => {
			cookiesToSet.forEach(({ name, value, options }) => {
				cookies.set(name, value, { path: '/', ...options });
			});
		}
	});

	const parentId = url.searchParams.get('parentId');

	if (!parentId) {
		return json({ error: 'Parent ID required' }, { status: 400 });
	}

	const { data: discussions, error } = await supabase
		.from('discussions')
		.select(
			`
			*,
			profiles:user_id (username)
		`
		)
		.eq('parent_id', parentId)
		.order('created_at', { ascending: true });

	if (error) {
		console.error('Error fetching replies:', error);
		return json({ error: 'Failed to fetch replies' }, { status: 500 });
	}

	return json({ discussions });
};

export const POST: RequestHandler = async ({ request, cookies }) => {
	const supabase = createSupabaseServerClient({
		getAll: () => cookies.getAll(),
		setAll: (cookiesToSet) => {
			cookiesToSet.forEach(({ name, value, options }) => {
				cookies.set(name, value, { path: '/', ...options });
			});
		}
	});

	// Check authentication using getUser() for secure server-side auth
	const {
		data: { user },
		error: authError
	} = await supabase.auth.getUser();

	if (authError || !user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	const body = await request.json();
	const { peptideId, content, parentId } = body;

	// Validate required fields
	if (!peptideId || !content?.trim()) {
		return json({ error: 'Peptide ID and content are required' }, { status: 400 });
	}

	// Content length validation
	if (content.length > 5000) {
		return json({ error: 'Content too long (max 5000 characters)' }, { status: 400 });
	}

	try {
		const { data: discussion, error: insertError } = await supabase
			.from('discussions')
			.insert({
				user_id: user.id,
				peptide_id: peptideId,
				content: content.trim(),
				parent_id: parentId || null
			})
			.select()
			.single();

		if (insertError) {
			console.error('Discussion insert error:', insertError);
			return json({ error: 'Failed to create discussion' }, { status: 500 });
		}

		return json({
			success: true,
			discussion
		});
	} catch (error) {
		console.error('Unexpected error:', error);
		return json({ error: 'An unexpected error occurred' }, { status: 500 });
	}
};
