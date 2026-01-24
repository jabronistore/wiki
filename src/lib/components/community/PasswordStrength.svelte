<script lang="ts">
	interface Props {
		password: string;
	}

	let { password }: Props = $props();

	// Calculate password strength
	let strength = $derived.by(() => {
		if (!password) return { score: 0, label: '', color: '' };

		let score = 0;
		const checks = {
			length: password.length >= 8,
			uppercase: /[A-Z]/.test(password),
			lowercase: /[a-z]/.test(password),
			number: /[0-9]/.test(password),
			special: /[^a-zA-Z0-9]/.test(password)
		};

		if (checks.length) score++;
		if (checks.uppercase) score++;
		if (checks.lowercase) score++;
		if (checks.number) score++;
		if (checks.special) score++;

		if (password.length >= 12) score++;
		if (password.length >= 16) score++;

		// Normalize to 0-4 scale
		const normalized = Math.min(4, Math.floor((score / 7) * 4));

		const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
		const colors = ['bg-destructive', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500'];

		return {
			score: normalized,
			label: labels[normalized],
			color: colors[normalized],
			checks
		};
	});
</script>

<div class="space-y-2">
	<!-- Strength bar -->
	<div class="flex gap-1">
		{#each [0, 1, 2, 3] as i}
			<div
				class="h-1.5 flex-1 rounded-full transition-colors {i <= strength.score - 1
					? strength.color
					: 'bg-muted'}"
			></div>
		{/each}
	</div>

	<!-- Strength label -->
	{#if password}
		<div class="flex items-center justify-between text-xs">
			<span class="text-muted-foreground">Password strength:</span>
			<span class="font-medium {strength.score >= 3 ? 'text-green-600' : 'text-muted-foreground'}">
				{strength.label}
			</span>
		</div>

		<!-- Requirements checklist -->
		<ul class="text-xs text-muted-foreground space-y-0.5">
			<li class:text-green-600={strength.checks?.length}>
				{strength.checks?.length ? '✓' : '○'} At least 8 characters
			</li>
			<li class:text-green-600={strength.checks?.uppercase}>
				{strength.checks?.uppercase ? '✓' : '○'} One uppercase letter
			</li>
			<li class:text-green-600={strength.checks?.number}>
				{strength.checks?.number ? '✓' : '○'} One number
			</li>
			<li class:text-green-600={strength.checks?.special}>
				{strength.checks?.special ? '✓' : '○'} One special character
			</li>
		</ul>
	{/if}
</div>
