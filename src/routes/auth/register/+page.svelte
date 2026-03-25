<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { AlertCircle, Eye, EyeOff, Info } from 'lucide-svelte';
	import PasswordStrength from '$lib/components/community/PasswordStrength.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Redirect if already logged in
	$effect(() => {
		if (data.user) {
			goto('/');
		}
	});

	// Form state
	let username = $state('');
	let email = $state('');
	let password = $state('');
	let location = $state('');
	let newsletterOptIn = $state(false);
	let termsAccepted = $state(false);
	let showPassword = $state(false);

	// UI state
	let isSubmitting = $state(false);
	let error = $state('');
	let fieldErrors = $state<Record<string, string>>({});

	function validateForm(): boolean {
		const errors: Record<string, string> = {};

		if (!username || username.length < 3) {
			errors.username = 'Username must be at least 3 characters';
		} else if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
			errors.username = 'Username can only contain letters, numbers, underscores, and hyphens';
		}

		if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			errors.email = 'Please enter a valid email address';
		}

		if (!password || password.length < 8) {
			errors.password = 'Password must be at least 8 characters';
		}

		if (!termsAccepted) {
			errors.terms = 'You must accept the terms and conditions';
		}

		fieldErrors = errors;
		return Object.keys(errors).length === 0;
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();

		if (!validateForm()) return;

		isSubmitting = true;
		error = '';

		try {
			const response = await fetch('/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					username,
					email,
					password,
					location,
					newsletterOptIn
				})
			});

			const result = await response.json();

			if (!response.ok) {
				error = result.error || 'Registration failed';
				return;
			}

			// Refresh session data then redirect to onboarding
			await invalidateAll();
			goto('/onboarding');
		} catch (err) {
			error = 'An unexpected error occurred. Please try again.';
			console.error(err);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Register | Peptide Database</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center px-4 py-12">
	<div class="w-full max-w-md">
		<div class="mb-8 text-center">
			<h1 class="text-2xl font-bold">Create an Account</h1>
			<p class="mt-2 text-muted-foreground">
				Join the community to share research findings and discuss peptides
			</p>
		</div>

		<form onsubmit={handleSubmit} class="space-y-6 rounded-lg border border-border bg-card p-6">
			{#if error}
				<div
					class="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
				>
					<AlertCircle class="h-4 w-4 flex-shrink-0" />
					<span>{error}</span>
				</div>
			{/if}

			<!-- Username -->
			<div class="space-y-2">
				<label for="username" class="text-sm font-medium">
					Username <span class="text-destructive">*</span>
				</label>
				<div
					class="mb-2 flex items-start gap-2 rounded bg-muted/50 p-2 text-xs text-muted-foreground"
				>
					<Info class="mt-0.5 h-4 w-4 flex-shrink-0" />
					<span>
						Choose an anonymous username. <strong>DO NOT</strong> use your real name or email address!
					</span>
				</div>
				<input
					type="text"
					id="username"
					bind:value={username}
					class="w-full rounded-md border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
					placeholder="peptide_researcher_42"
					required
				/>
				{#if fieldErrors.username}
					<p class="text-xs text-destructive">{fieldErrors.username}</p>
				{/if}
			</div>

			<!-- Email -->
			<div class="space-y-2">
				<label for="email" class="text-sm font-medium">
					Email <span class="text-destructive">*</span>
				</label>
				<div
					class="mb-2 flex items-start gap-2 rounded bg-muted/50 p-2 text-xs text-muted-foreground"
				>
					<Info class="mt-0.5 h-4 w-4 flex-shrink-0" />
					<span>
						For enhanced privacy, consider using a throwaway email from Proton.me, Gmail, or
						Outlook.
					</span>
				</div>
				<input
					type="email"
					id="email"
					bind:value={email}
					class="w-full rounded-md border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
					placeholder="anonymous@example.com"
					required
				/>
				{#if fieldErrors.email}
					<p class="text-xs text-destructive">{fieldErrors.email}</p>
				{/if}
			</div>

			<!-- Password -->
			<div class="space-y-2">
				<label for="password" class="text-sm font-medium">
					Password <span class="text-destructive">*</span>
				</label>
				<div class="relative">
					<input
						type={showPassword ? 'text' : 'password'}
						id="password"
						bind:value={password}
						class="w-full rounded-md border border-border bg-background px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-ring"
						placeholder="••••••••"
						required
					/>
					<button
						type="button"
						onclick={() => (showPassword = !showPassword)}
						class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
					>
						{#if showPassword}
							<EyeOff class="h-4 w-4" />
						{:else}
							<Eye class="h-4 w-4" />
						{/if}
					</button>
				</div>
				<PasswordStrength {password} />
				{#if fieldErrors.password}
					<p class="text-xs text-destructive">{fieldErrors.password}</p>
				{/if}
			</div>

			<!-- Location -->
			<div class="space-y-2">
				<label for="location" class="text-sm font-medium"> From (optional) </label>
				<input
					type="text"
					id="location"
					bind:value={location}
					class="w-full rounded-md border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
					placeholder="e.g., US, EU, Asia-Pacific"
				/>
				<p class="text-xs text-muted-foreground">
					An exact location is not required. Just a general area is helpful.
				</p>
			</div>

			<!-- Newsletter -->
			<div class="flex items-center gap-2">
				<input
					type="checkbox"
					id="newsletter"
					bind:checked={newsletterOptIn}
					class="rounded border-border"
				/>
				<label for="newsletter" class="text-sm"> Receive news and updates by email </label>
			</div>

			<!-- Terms -->
			<div class="space-y-2">
				<div class="flex items-start gap-2">
					<input
						type="checkbox"
						id="terms"
						bind:checked={termsAccepted}
						class="mt-1 rounded border-border"
						required
					/>
					<label for="terms" class="text-sm">
						I agree to the <a href="/terms" class="text-accent hover:underline"
							>Terms & Conditions</a
						>,
						<a href="/privacy" class="text-accent hover:underline">Privacy Policy</a>, and community
						guidelines.
						<span class="text-destructive">*</span>
					</label>
				</div>
				{#if fieldErrors.terms}
					<p class="text-xs text-destructive">{fieldErrors.terms}</p>
				{/if}
			</div>

			<!-- Submit -->
			<button
				type="submit"
				disabled={isSubmitting}
				class="w-full rounded-md bg-accent px-4 py-2 text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{#if isSubmitting}
					Creating account...
				{:else}
					Create Account
				{/if}
			</button>

			<p class="text-center text-sm text-muted-foreground">
				Already have an account?
				<a href="/auth/login" class="text-accent hover:underline">Sign in</a>
			</p>
		</form>
	</div>
</div>
