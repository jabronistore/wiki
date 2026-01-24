/// <reference types="../../.svelte-kit/ambient.d.ts" />
import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { Database } from './types/database';

/**
 * Create a Supabase client for browser-side usage
 * Returns null if Supabase is not configured
 */
export function createSupabaseBrowserClient() {
	if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) return null;
	return createBrowserClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
}

/**
 * Create a Supabase client for server-side usage (SSR)
 * This properly handles cookies for session management
 * Returns null if Supabase is not configured
 */
export function createSupabaseServerClient(
	cookies: {
		getAll: () => { name: string; value: string }[];
		setAll: (cookies: { name: string; value: string; options?: object }[]) => void;
	}
) {
	if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) return null;
	return createServerClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			getAll() {
				return cookies.getAll();
			},
			setAll(cookiesToSet) {
				cookies.setAll(
					cookiesToSet.map(({ name, value, options }) => ({
						name,
						value,
						options: {
							...options,
							path: '/',
							sameSite: 'lax' as const,
							httpOnly: true,
							secure: false // Set to true in production with HTTPS
						}
					}))
				);
			}
		}
	});
}
