import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals }) => {
	const supabase = locals.supabase;

	if (!supabase) {
		return json({ error: 'Service not available' }, { status: 503 });
	}

	// Use getUser() instead of getSession() for secure server-side auth
	const {
		data: { user },
		error: authError
	} = await supabase.auth.getUser();

	if (authError || !user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	const { error: updateError } = await supabase
		.from('profiles')
		.update({ onboarding_completed: true })
		.eq('id', user.id);

	if (updateError) {
		console.error('Error completing onboarding:', updateError);
		return json({ error: 'Failed to complete onboarding' }, { status: 500 });
	}

	return json({ success: true });
};
