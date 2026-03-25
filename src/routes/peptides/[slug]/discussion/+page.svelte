<script lang="ts">
	import { MessageSquare, Send, LogIn } from 'lucide-svelte';
	import type { PageData } from './$types';
	import type { Peptide } from '$lib/types';
	import type { Database } from '$lib/types/database';
	import DiscussionThread from '$lib/components/community/DiscussionThread.svelte';

	type Discussion = Database['public']['Tables']['discussions']['Row'] & {
		profiles: { username: string } | null;
	};

	let { data }: { data: PageData } = $props();
	const peptide = data.peptide as Peptide;
	const user = data.user;
	const profile = data.profile;

	let discussions = $state(data.discussions as Discussion[]);
	let userUpvotes = $state(new Set(data.userUpvotes as string[]));

	// New post form
	let newPostContent = $state('');
	let isSubmitting = $state(false);
	let error = $state('');

	async function submitPost() {
		if (!newPostContent.trim() || !user) return;

		isSubmitting = true;
		error = '';

		try {
			const response = await fetch('/api/discussions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					peptideId: peptide.id,
					content: newPostContent.trim()
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to post');
			}

			// Add new discussion to list
			discussions = [
				{
					...result.discussion,
					profiles: { username: profile?.username || 'Unknown' }
				},
				...discussions
			];
			newPostContent = '';
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to post';
		} finally {
			isSubmitting = false;
		}
	}

	async function handleUpvote(discussionId: string) {
		if (!user) return;

		const wasUpvoted = userUpvotes.has(discussionId);

		try {
			const response = await fetch('/api/discussions/upvote', {
				method: wasUpvoted ? 'DELETE' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ discussionId })
			});

			if (response.ok) {
				if (wasUpvoted) {
					userUpvotes.delete(discussionId);
				} else {
					userUpvotes.add(discussionId);
				}
				userUpvotes = new Set(userUpvotes);

				// Update count in discussions
				discussions = discussions.map((d) =>
					d.id === discussionId ? { ...d, upvote_count: d.upvote_count + (wasUpvoted ? -1 : 1) } : d
				);
			}
		} catch (e) {
			console.error('Upvote error:', e);
		}
	}

	function handleReplyCountUpdate(discussionId: string, delta: number) {
		discussions = discussions.map((d) =>
			d.id === discussionId ? { ...d, reply_count: d.reply_count + delta } : d
		);
	}
</script>

<svelte:head>
	<title>Discussion - {peptide.name} | Peptide Database</title>
	<meta
		name="description"
		content="Join the community discussion about {peptide.name}. Share experiences, ask questions, and learn from others."
	/>
</svelte:head>

<div class="discussion-page">
	<header class="page-header">
		<div class="breadcrumb">
			<a href="/peptides">Peptides</a>
			<span>/</span>
			<a href="/peptides/{peptide.id}">{peptide.name}</a>
			<span>/</span>
			<span>Discussion</span>
		</div>
		<h1>
			<MessageSquare class="h-8 w-8" />
			Community Discussion
		</h1>
		<p class="subtitle">
			Share experiences, ask questions, and learn from others about {peptide.name}
		</p>
	</header>

	<!-- New Post Form -->
	{#if user}
		<div class="new-post-form">
			<div class="form-header">
				<span class="posting-as">Posting as <strong>{profile?.username}</strong></span>
			</div>
			<textarea
				bind:value={newPostContent}
				placeholder="Start a discussion about {peptide.name}..."
				rows="4"
				disabled={isSubmitting}
			></textarea>
			{#if error}
				<p class="error-message">{error}</p>
			{/if}
			<div class="form-actions">
				<button
					class="btn-primary"
					onclick={submitPost}
					disabled={isSubmitting || !newPostContent.trim()}
				>
					<Send class="h-4 w-4" />
					{isSubmitting ? 'Posting...' : 'Post Discussion'}
				</button>
			</div>
		</div>
	{:else}
		<div class="login-prompt">
			<LogIn class="h-6 w-6" />
			<p>
				<a href="/auth/login?redirect=/peptides/{peptide.id}/discussion">Log in</a> or
				<a href="/auth/register?redirect=/peptides/{peptide.id}/discussion">register</a> to join the
				discussion.
			</p>
		</div>
	{/if}

	<!-- Discussions List -->
	<section class="discussions-section">
		{#if discussions.length === 0}
			<div class="no-discussions">
				<MessageSquare class="h-12 w-12" />
				<h2>No Discussions Yet</h2>
				<p>Be the first to start a discussion about {peptide.name}.</p>
			</div>
		{:else}
			<div class="discussions-list">
				{#each discussions as discussion (discussion.id)}
					<DiscussionThread
						{discussion}
						{user}
						{profile}
						{userUpvotes}
						peptideId={peptide.id}
						depth={0}
						onUpvote={handleUpvote}
						onReplyCountUpdate={handleReplyCountUpdate}
					/>
				{/each}
			</div>
		{/if}
	</section>
</div>

<style>
	.discussion-page {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	.page-header {
		margin-bottom: 2rem;
	}

	.breadcrumb {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		margin-bottom: 1rem;
	}

	.breadcrumb a {
		color: hsl(var(--accent));
		text-decoration: none;
	}

	.breadcrumb a:hover {
		text-decoration: underline;
	}

	h1 {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 2rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		margin-bottom: 0.5rem;
	}

	.subtitle {
		color: hsl(var(--muted-foreground));
	}

	/* Login Prompt */
	.login-prompt {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem;
		background: hsl(var(--muted));
		border: 1px solid hsl(var(--border));
		border-radius: 12px;
		margin-bottom: 2rem;
		color: hsl(var(--muted-foreground));
	}

	.login-prompt a {
		color: hsl(var(--accent));
		font-weight: 500;
	}

	/* New Post Form */
	.new-post-form {
		background: hsl(var(--muted));
		border: 1px solid hsl(var(--border));
		border-radius: 12px;
		padding: 1.5rem;
		margin-bottom: 2rem;
	}

	.form-header {
		margin-bottom: 1rem;
	}

	.posting-as {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
	}

	.new-post-form textarea {
		width: 100%;
		padding: 1rem;
		border: 1px solid hsl(var(--border));
		border-radius: 8px;
		background: hsl(var(--background));
		color: hsl(var(--foreground));
		font-size: 0.9375rem;
		font-family: inherit;
		resize: vertical;
		margin-bottom: 1rem;
	}

	.new-post-form textarea:focus {
		outline: none;
		border-color: hsl(var(--accent));
	}

	.error-message {
		color: hsl(var(--destructive));
		font-size: 0.875rem;
		margin-bottom: 1rem;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
	}

	.btn-primary {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1.25rem;
		background: hsl(var(--accent));
		color: white;
		border: none;
		border-radius: 8px;
		font-weight: 500;
		cursor: pointer;
		transition: opacity 0.2s;
	}

	.btn-primary:hover:not(:disabled) {
		opacity: 0.9;
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* No Discussions */
	.no-discussions {
		text-align: center;
		padding: 4rem 2rem;
		background: hsl(var(--muted));
		border: 1px solid hsl(var(--border));
		border-radius: 12px;
		color: hsl(var(--muted-foreground));
	}

	.no-discussions h2 {
		font-size: 1.5rem;
		margin: 1rem 0 0.5rem;
		color: hsl(var(--foreground));
	}

	/* Discussions List */
	.discussions-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
</style>
