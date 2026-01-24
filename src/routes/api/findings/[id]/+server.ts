import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSupabaseServerClient } from '$lib/supabase';

export const DELETE: RequestHandler = async ({ params, cookies }) => {
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

	const findingId = params.id;

	try {
		// First verify the finding belongs to the user
		const { data: finding, error: fetchError } = await supabase
			.from('findings')
			.select('user_id')
			.eq('id', findingId)
			.single();

		if (fetchError || !finding) {
			return json({ error: 'Finding not found' }, { status: 404 });
		}

		if (finding.user_id !== user.id) {
			return json({ error: 'Unauthorized' }, { status: 403 });
		}

		// Delete related records first (cascade should handle this, but being explicit)
		await supabase.from('finding_dosing_phases').delete().eq('finding_id', findingId);
		await supabase.from('finding_side_effects').delete().eq('finding_id', findingId);
		await supabase.from('finding_results').delete().eq('finding_id', findingId);

		// Delete the finding
		const { error: deleteError } = await supabase.from('findings').delete().eq('id', findingId);

		if (deleteError) {
			console.error('Delete error:', deleteError);
			return json({ error: 'Failed to delete finding' }, { status: 500 });
		}

		return json({ success: true });
	} catch (error) {
		console.error('Unexpected error:', error);
		return json({ error: 'An unexpected error occurred' }, { status: 500 });
	}
};
