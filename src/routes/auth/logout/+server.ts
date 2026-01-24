import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSupabaseServerClient } from '$lib/supabase';
import { dev } from '$app/environment';

export const POST: RequestHandler = async ({ cookies }) => {
	const supabase = createSupabaseServerClient({
		getAll: () => cookies.getAll(),
		setAll: (cookiesToSet) => {
			cookiesToSet.forEach(({ name, value, options }) => {
				cookies.set(name, value, {
					...options,
					path: '/',
					sameSite: 'lax',
					httpOnly: true,
					secure: !dev
				});
			});
		}
	});

	if (supabase) {
		await supabase.auth.signOut();
	}

	throw redirect(303, '/');
};

export const GET: RequestHandler = async ({ cookies }) => {
	const supabase = createSupabaseServerClient({
		getAll: () => cookies.getAll(),
		setAll: (cookiesToSet) => {
			cookiesToSet.forEach(({ name, value, options }) => {
				cookies.set(name, value, {
					...options,
					path: '/',
					sameSite: 'lax',
					httpOnly: true,
					secure: !dev
				});
			});
		}
	});

	if (supabase) {
		await supabase.auth.signOut();
	}

	throw redirect(303, '/');
};
