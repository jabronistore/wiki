<script lang="ts">
	import { User as UserIcon, LogOut, Heart, FileText, ChevronDown } from 'lucide-svelte';
	import type { Profile } from '$lib/types/community';
	import type { User } from '@supabase/supabase-js';

	interface Props {
		user: User | null;
		profile: Profile | null;
	}

	let { user, profile }: Props = $props();

	let isOpen = $state(false);

	function toggleMenu() {
		isOpen = !isOpen;
	}

	function closeMenu() {
		isOpen = false;
	}
</script>

<svelte:window
	onclick={(e) => {
		const target = e.target as HTMLElement;
		if (!target.closest('.user-menu')) {
			closeMenu();
		}
	}}
/>

<div class="user-menu relative">
	{#if user && profile}
		<!-- Logged in state -->
		<button
			onclick={toggleMenu}
			class="flex items-center gap-2 rounded-md px-3 py-1.5 transition-colors hover:bg-muted"
		>
			<div class="flex h-7 w-7 items-center justify-center rounded-full bg-accent/20">
				<UserIcon class="h-4 w-4 text-accent" />
			</div>
			<span class="hidden text-sm font-medium sm:inline">{profile.username}</span>
			<ChevronDown class="h-4 w-4 text-muted-foreground" />
		</button>

		{#if isOpen}
			<div
				class="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-border bg-card py-1 shadow-lg"
			>
				<div class="border-b border-border px-4 py-2">
					<p class="text-sm font-medium">{profile.username}</p>
					<p class="text-xs text-muted-foreground">{user.email}</p>
				</div>

				<a
					href="/profile/my-submissions"
					onclick={closeMenu}
					class="flex items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-muted"
				>
					<FileText class="h-4 w-4" />
					My Submissions
				</a>

				<a
					href="/profile/favorites"
					onclick={closeMenu}
					class="flex items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-muted"
				>
					<Heart class="h-4 w-4" />
					Favorites
				</a>

				<div class="my-1 border-t border-border"></div>

				<a
					href="/auth/logout"
					onclick={closeMenu}
					class="flex items-center gap-3 px-4 py-2 text-sm text-destructive transition-colors hover:bg-muted"
				>
					<LogOut class="h-4 w-4" />
					Sign Out
				</a>
			</div>
		{/if}
	{:else}
		<!-- Logged out state -->
		<div class="flex items-center gap-2">
			<a href="/auth/login" class="px-3 py-1.5 text-sm transition-colors hover:text-accent">
				Sign In
			</a>
			<a
				href="/auth/register"
				class="rounded-md bg-accent px-3 py-1.5 text-sm text-white transition-colors hover:bg-accent/90"
			>
				Register
			</a>
		</div>
	{/if}
</div>
