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
			class="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-muted transition-colors"
		>
			<div class="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center">
				<UserIcon class="h-4 w-4 text-accent" />
			</div>
			<span class="text-sm font-medium hidden sm:inline">{profile.username}</span>
			<ChevronDown class="h-4 w-4 text-muted-foreground" />
		</button>

		{#if isOpen}
			<div
				class="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-lg shadow-lg py-1 z-50"
			>
				<div class="px-4 py-2 border-b border-border">
					<p class="text-sm font-medium">{profile.username}</p>
					<p class="text-xs text-muted-foreground">{user.email}</p>
				</div>

				<a
					href="/profile/my-submissions"
					onclick={closeMenu}
					class="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors"
				>
					<FileText class="h-4 w-4" />
					My Submissions
				</a>

				<a
					href="/profile/favorites"
					onclick={closeMenu}
					class="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors"
				>
					<Heart class="h-4 w-4" />
					Favorites
				</a>

				<div class="border-t border-border my-1"></div>

				<a
					href="/auth/logout"
					onclick={closeMenu}
					class="flex items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-muted transition-colors"
				>
					<LogOut class="h-4 w-4" />
					Sign Out
				</a>
			</div>
		{/if}
	{:else}
		<!-- Logged out state -->
		<div class="flex items-center gap-2">
			<a
				href="/auth/login"
				class="text-sm px-3 py-1.5 hover:text-accent transition-colors"
			>
				Sign In
			</a>
			<a
				href="/auth/register"
				class="text-sm px-3 py-1.5 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors"
			>
				Register
			</a>
		</div>
	{/if}
</div>
