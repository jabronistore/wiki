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

	// Check authentication using getUser() for secure server-side auth
	const {
		data: { user },
		error: authError
	} = await supabase.auth.getUser();

	if (authError || !user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	const body = await request.json();
	const { peptideId } = body;

	if (!peptideId) {
		return json({ error: 'Peptide ID required' }, { status: 400 });
	}

	try {
		const { data, error: insertError } = await supabase
			.from('user_favorite_peptides')
			.insert({
				user_id: user.id,
				peptide_id: peptideId
			})
			.select()
			.single();

		if (insertError) {
			if (insertError.code === '23505') {
				return json({ error: 'Already favorited' }, { status: 400 });
			}
			console.error('Favorite insert error:', insertError);
			return json({ error: 'Failed to add favorite' }, { status: 500 });
		}

		return json({ success: true, favorite: data });
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

	// Check authentication using getUser() for secure server-side auth
	const {
		data: { user },
		error: authError
	} = await supabase.auth.getUser();

	if (authError || !user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	const body = await request.json();
	const { peptideId } = body;

	if (!peptideId) {
		return json({ error: 'Peptide ID required' }, { status: 400 });
	}

	try {
		const { error: deleteError } = await supabase
			.from('user_favorite_peptides')
			.delete()
			.eq('user_id', user.id)
			.eq('peptide_id', peptideId);

		if (deleteError) {
			console.error('Favorite delete error:', deleteError);
			return json({ error: 'Failed to remove favorite' }, { status: 500 });
		}

		return json({ success: true });
	} catch (error) {
		console.error('Unexpected error:', error);
		return json({ error: 'An unexpected error occurred' }, { status: 500 });
	}
};
