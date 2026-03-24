import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { Handle } from '@sveltejs/kit';
import type { Database } from '$lib/types/database';

// Load raw guide markdown at build time (Cloudflare-compatible, no fs needed)
const guideRawFiles = import.meta.glob('/src/guides/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

function getGuideMarkdown(slug: string): string | null {
	const key = `/src/guides/${slug}.md`;
	return guideRawFiles[key] ?? null;
}

export const handle: Handle = async ({ event, resolve }) => {
	const { url, request } = event;
	const accept = request.headers.get('accept') || '';

	// Content negotiation: serve raw markdown when explicitly requested
	if (accept.includes('text/markdown') && !accept.includes('text/html')) {
		const guideMatch = url.pathname.match(/^\/guides\/([a-z0-9-]+)$/);
		if (guideMatch) {
			const markdown = getGuideMarkdown(guideMatch[1]);
			if (markdown) {
				return new Response(markdown, {
					headers: {
						'Content-Type': 'text/markdown; charset=utf-8',
						'X-Llms-Txt': '/llms.txt',
						Link: '</llms.txt>; rel="llms-txt"',
						'X-Markdown-Tokens': String(Math.ceil(markdown.length / 4)),
						'Cache-Control': 'public, max-age=3600'
					}
				});
			}
		}
	}

	// Skip if Supabase isn't configured
	if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
		event.locals.supabase = null;
		event.locals.session = null;
		event.locals.user = null;
		event.locals.safeGetSession = async () => ({ session: null, user: null });
		const response = await resolve(event);
		return addDiscoveryHeaders(response);
	}

	// Create Supabase client for this request
	const supabase = createServerClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
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

	event.locals.supabase = supabase;

	// Helper to safely get session
	event.locals.safeGetSession = async () => {
		const {
			data: { session },
			error: sessionError
		} = await supabase.auth.getSession();

		if (sessionError || !session) {
			return { session: null, user: null };
		}

		// Validate with getUser for security
		const {
			data: { user },
			error: userError
		} = await supabase.auth.getUser();

		if (userError || !user) {
			return { session: null, user: null };
		}

		return { session, user };
	};

	// Get session for this request
	const { session, user } = await event.locals.safeGetSession();
	event.locals.session = session;
	event.locals.user = user;

	const response = await resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});

	return addDiscoveryHeaders(response);
};

/**
 * Add llms.txt discovery headers to all HTML responses.
 * AI crawlers use these to find the site's content index.
 */
function addDiscoveryHeaders(response: Response): Response {
	const contentType = response.headers.get('content-type') || '';
	if (contentType.includes('text/html')) {
		const newHeaders = new Headers(response.headers);
		newHeaders.set('X-Llms-Txt', '/llms.txt');
		newHeaders.append('Link', '</llms.txt>; rel="llms-txt"');

		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: newHeaders
		});
	}
	return response;
}
