<script lang="ts">
	import { onMount } from 'svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import { AlertCircle, Eye, EyeOff } from 'lucide-svelte';
	import { loadRecaptcha, executeRecaptcha } from '$lib/utils/recaptcha';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Get redirect URL from query params
	let redirectTo = $derived($page.url.searchParams.get('redirect') || '/');

	// Redirect if already logged in
	$effect(() => {
		if (data.user) {
			goto(redirectTo);
		}
	});

	// Form state
	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let rememberMe = $state(false);

	// UI state
	let isSubmitting = $state(false);
	let error = $state('');

	onMount(() => {
		loadRecaptcha();
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();

		if (!email || !password) {
			error = 'Please enter your email and password';
			return;
		}

		isSubmitting = true;
		error = '';

		try {
			const recaptchaToken = await executeRecaptcha('login');

			const response = await fetch('/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email,
					password,
					recaptchaToken
				})
			});

			const result = await response.json();

			if (!response.ok) {
				error = result.error || 'Login failed';
				return;
			}

			// Success - invalidate all data and redirect
			await invalidateAll();
			goto(redirectTo);
		} catch (err) {
			error = 'An unexpected error occurred. Please try again.';
			console.error(err);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Sign In | Peptide Database</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center py-12 px-4">
	<div class="w-full max-w-md">
		<div class="text-center mb-8">
			<h1 class="text-2xl font-bold">Welcome Back</h1>
			<p class="text-muted-foreground mt-2">Sign in to your account to continue</p>
		</div>

		<form onsubmit={handleSubmit} class="space-y-6 bg-card p-6 rounded-lg border border-border">
			{#if error}
				<div
					class="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md text-sm"
				>
					<AlertCircle class="h-4 w-4 flex-shrink-0" />
					<span>{error}</span>
				</div>
			{/if}

			<!-- Email -->
			<div class="space-y-2">
				<label for="email" class="text-sm font-medium">Email</label>
				<input
					type="email"
					id="email"
					bind:value={email}
					class="w-full px-3 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
					placeholder="you@example.com"
					required
				/>
			</div>

			<!-- Password -->
			<div class="space-y-2">
				<label for="password" class="text-sm font-medium">Password</label>
				<div class="relative">
					<input
						type={showPassword ? 'text' : 'password'}
						id="password"
						bind:value={password}
						class="w-full px-3 py-2 pr-10 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
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
			</div>

			<!-- Remember me -->
			<div class="flex items-center gap-2">
				<input type="checkbox" id="remember" bind:checked={rememberMe} class="rounded border-border" />
				<label for="remember" class="text-sm">Remember me</label>
			</div>

			<!-- Submit -->
			<button
				type="submit"
				disabled={isSubmitting}
				class="w-full py-2 px-4 bg-accent text-white rounded-md hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			>
				{#if isSubmitting}
					Signing in...
				{:else}
					Sign In
				{/if}
			</button>

			<p class="text-center text-sm text-muted-foreground">
				Don't have an account?
				<a href="/auth/register" class="text-accent hover:underline">Create one</a>
			</p>
		</form>

		<p class="text-xs text-center text-muted-foreground mt-4">
			This site is protected by reCAPTCHA and the Google
			<a href="https://policies.google.com/privacy" class="hover:underline" target="_blank"
				>Privacy Policy</a
			>
			and
			<a href="https://policies.google.com/terms" class="hover:underline" target="_blank"
				>Terms of Service</a
			>
			apply.
		</p>
	</div>
</div>
