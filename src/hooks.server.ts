import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// Skip if Supabase isn't configured
	if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
		return resolve(event);
	}

	// Create Supabase client for this request
	event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookiesToSet) => {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, {
						...options,
						path: '/',
						httpOnly: options?.httpOnly ?? false,
						secure: process.env.NODE_ENV === 'production',
						sameSite: 'lax'
					});
				});
			}
		}
	});

	// Helper to safely get session
	event.locals.safeGetSession = async () => {
		const {
			data: { session },
			error: sessionError
		} = await event.locals.supabase.auth.getSession();

		if (sessionError || !session) {
			return { session: null, user: null };
		}

		// Validate with getUser for security
		const {
			data: { user },
			error: userError
		} = await event.locals.supabase.auth.getUser();

		if (userError || !user) {
			return { session: null, user: null };
		}

		return { session, user };
	};

	// Get session for this request
	const { session, user } = await event.locals.safeGetSession();
	event.locals.session = session;
	event.locals.user = user;

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};
