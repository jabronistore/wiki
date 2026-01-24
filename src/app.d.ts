// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import type { SupabaseClient, Session, User } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database';

declare global {
	namespace App {
		interface Error {
			message: string;
			sensorId?: string;
			sensorName?: string;
			indexId?: string;
			indexName?: string;
			validIndices?: string[];
		}
		interface Locals {
			supabase: SupabaseClient<Database>;
			safeGetSession: () => Promise<{ session: Session | null; user: User | null }>;
			session: Session | null;
			user: User | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
