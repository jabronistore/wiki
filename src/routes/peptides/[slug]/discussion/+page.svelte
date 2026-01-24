<script lang="ts">
	import {
		MessageSquare,
		ChevronUp,
		Reply,
		ChevronDown,
		ChevronRight,
		Send,
		LogIn
	} from 'lucide-svelte';
	import type { PageData } from './$types';
	import type { Peptide } from '$lib/types';
	import type { Database } from '$lib/types/database';

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

	// Reply forms
	let replyingTo = $state<string | null>(null);
	let replyContent = $state('');
	let isSubmittingReply = $state(false);

	// Expanded replies
	let expandedThreads = $state<Record<string, boolean>>({});
	let loadedReplies = $state<Record<string, Discussion[]>>({});
	let loadingReplies = $state<Record<string, boolean>>({});

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);

		if (minutes < 1) return 'just now';
		if (minutes < 60) return `${minutes}m ago`;
		if (hours < 24) return `${hours}h ago`;
		if (days < 7) return `${days}d ago`;

		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
		});
	}

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

	async function submitReply(parentId: string) {
		if (!replyContent.trim() || !user) return;

		isSubmittingReply = true;

		try {
			const response = await fetch('/api/discussions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					peptideId: peptide.id,
					content: replyContent.trim(),
					parentId
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to reply');
			}

			// Add reply to loaded replies
			if (loadedReplies[parentId]) {
				loadedReplies[parentId] = [
					...loadedReplies[parentId],
					{
						...result.discussion,
						profiles: { username: profile?.username || 'Unknown' }
					}
				];
			}

			// Update parent reply count
			discussions = discussions.map((d) =>
				d.id === parentId ? { ...d, reply_count: d.reply_count + 1 } : d
			);

			replyContent = '';
			replyingTo = null;
		} catch (e) {
			console.error('Reply error:', e);
		} finally {
			isSubmittingReply = false;
		}
	}

	async function toggleReplies(discussionId: string, replyCount: number) {
		if (replyCount === 0) return;

		if (expandedThreads[discussionId]) {
			expandedThreads = { ...expandedThreads, [discussionId]: false };
			return;
		}

		// Load replies if not already loaded
		if (!loadedReplies[discussionId]) {
			loadingReplies = { ...loadingReplies, [discussionId]: true };

			try {
				const response = await fetch(`/api/discussions?parentId=${discussionId}`);
				const result = await response.json();

				if (response.ok) {
					loadedReplies = { ...loadedReplies, [discussionId]: result.discussions };
				}
			} catch (e) {
				console.error('Failed to load replies:', e);
			} finally {
				loadingReplies = { ...loadingReplies, [discussionId]: false };
			}
		}

		expandedThreads = { ...expandedThreads, [discussionId]: true };
	}

	async function toggleUpvote(discussionId: string) {
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
					userUpvotes = new Set(userUpvotes);
				} else {
					userUpvotes.add(discussionId);
					userUpvotes = new Set(userUpvotes);
				}

				// Update count in discussions
				discussions = discussions.map((d) =>
					d.id === discussionId
						? { ...d, upvote_count: d.upvote_count + (wasUpvoted ? -1 : 1) }
						: d
				);

				// Update in loaded replies
				Object.keys(loadedReplies).forEach((parentId) => {
					loadedReplies[parentId] = loadedReplies[parentId].map((r) =>
						r.id === discussionId
							? { ...r, upvote_count: r.upvote_count + (wasUpvoted ? -1 : 1) }
							: r
					);
				});
			}
		} catch (e) {
			console.error('Upvote error:', e);
		}
	}
</script>

<svelte:head>
	<title>Discussion - {peptide.name} | PepPedia</title>
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
		<p class="subtitle">Share experiences, ask questions, and learn from others about {peptide.name}</p>
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
				<a href="/auth/register?redirect=/peptides/{peptide.id}/discussion">register</a> to join the discussion.
			</p>
		</div>
	{/if}

	<!-- Discussions List -->
	<section class="discussions-section">
		{#if discussions.length === 0}
			<div class="no-discussions">
				<MessageSquare class="h-12 w-12 text-muted-foreground" />
				<h2>No Discussions Yet</h2>
				<p>Be the first to start a discussion about {peptide.name}.</p>
			</div>
		{:else}
			<div class="discussions-list">
				{#each discussions as discussion (discussion.id)}
					<article class="discussion-card">
						<div class="vote-column">
							<button
								class="upvote-btn"
								class:upvoted={userUpvotes.has(discussion.id)}
								onclick={() => toggleUpvote(discussion.id)}
								disabled={!user}
								title={user ? (userUpvotes.has(discussion.id) ? 'Remove upvote' : 'Upvote') : 'Log in to upvote'}
							>
								<ChevronUp class="h-5 w-5" />
							</button>
							<span class="vote-count">{discussion.upvote_count}</span>
						</div>

						<div class="discussion-content">
							<div class="discussion-meta">
								<span class="username">{discussion.profiles?.username || 'Unknown'}</span>
								<span class="separator">·</span>
								<time datetime={discussion.created_at}>{formatDate(discussion.created_at)}</time>
							</div>

							<p class="discussion-text">{discussion.content}</p>

							<div class="discussion-actions">
								{#if discussion.reply_count > 0}
									<button
										class="replies-toggle"
										onclick={() => toggleReplies(discussion.id, discussion.reply_count)}
									>
										{#if expandedThreads[discussion.id]}
											<ChevronDown class="h-4 w-4" />
										{:else}
											<ChevronRight class="h-4 w-4" />
										{/if}
										{discussion.reply_count} {discussion.reply_count === 1 ? 'reply' : 'replies'}
									</button>
								{/if}

								{#if user}
									<button
										class="reply-btn"
										onclick={() => (replyingTo = replyingTo === discussion.id ? null : discussion.id)}
									>
										<Reply class="h-4 w-4" />
										Reply
									</button>
								{/if}
							</div>

							<!-- Reply Form -->
							{#if replyingTo === discussion.id}
								<div class="reply-form">
									<textarea
										bind:value={replyContent}
										placeholder="Write a reply..."
										rows="3"
										disabled={isSubmittingReply}
									></textarea>
									<div class="reply-actions">
										<button class="btn-secondary" onclick={() => (replyingTo = null)}>
											Cancel
										</button>
										<button
											class="btn-primary"
											onclick={() => submitReply(discussion.id)}
											disabled={isSubmittingReply || !replyContent.trim()}
										>
											{isSubmittingReply ? 'Posting...' : 'Reply'}
										</button>
									</div>
								</div>
							{/if}

							<!-- Replies -->
							{#if expandedThreads[discussion.id]}
								{#if loadingReplies[discussion.id]}
									<div class="loading-replies">Loading replies...</div>
								{:else if loadedReplies[discussion.id]?.length > 0}
									<div class="replies-list">
										{#each loadedReplies[discussion.id] as reply (reply.id)}
											<div class="reply-card" style="margin-left: {Math.min(reply.depth * 16, 64)}px">
												<div class="reply-vote-column">
													<button
														class="upvote-btn small"
														class:upvoted={userUpvotes.has(reply.id)}
														onclick={() => toggleUpvote(reply.id)}
														disabled={!user}
													>
														<ChevronUp class="h-4 w-4" />
													</button>
													<span class="vote-count small">{reply.upvote_count}</span>
												</div>
												<div class="reply-content">
													<div class="discussion-meta">
														<span class="username">{reply.profiles?.username || 'Unknown'}</span>
														<span class="separator">·</span>
														<time datetime={reply.created_at}>{formatDate(reply.created_at)}</time>
													</div>
													<p class="discussion-text">{reply.content}</p>
												</div>
											</div>
										{/each}
									</div>
								{/if}
							{/if}
						</div>
					</article>
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
		color: var(--muted-foreground);
		margin-bottom: 1rem;
	}

	.breadcrumb a {
		color: var(--accent);
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
		color: var(--foreground);
		margin-bottom: 0.5rem;
	}

	.subtitle {
		color: var(--muted-foreground);
	}

	/* Login Prompt */
	.login-prompt {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem;
		background: var(--muted);
		border: 1px solid var(--border);
		border-radius: 12px;
		margin-bottom: 2rem;
	}

	.login-prompt a {
		color: var(--accent);
		font-weight: 500;
	}

	/* New Post Form */
	.new-post-form {
		background: var(--muted);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 1.5rem;
		margin-bottom: 2rem;
	}

	.form-header {
		margin-bottom: 1rem;
	}

	.posting-as {
		font-size: 0.875rem;
		color: var(--muted-foreground);
	}

	.new-post-form textarea {
		width: 100%;
		padding: 1rem;
		border: 1px solid var(--border);
		border-radius: 8px;
		background: var(--background);
		color: var(--foreground);
		font-size: 0.9375rem;
		resize: vertical;
		margin-bottom: 1rem;
	}

	.new-post-form textarea:focus {
		outline: none;
		border-color: var(--accent);
	}

	.error-message {
		color: var(--destructive);
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
		background: var(--accent);
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

	.btn-secondary {
		padding: 0.5rem 1rem;
		background: transparent;
		border: 1px solid var(--border);
		border-radius: 8px;
		color: var(--foreground);
		cursor: pointer;
	}

	/* No Discussions */
	.no-discussions {
		text-align: center;
		padding: 4rem 2rem;
		background: var(--muted);
		border: 1px solid var(--border);
		border-radius: 12px;
	}

	.no-discussions h2 {
		font-size: 1.5rem;
		margin: 1rem 0 0.5rem;
	}

	.no-discussions p {
		color: var(--muted-foreground);
	}

	/* Discussions List */
	.discussions-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.discussion-card {
		display: flex;
		gap: 1rem;
		background: var(--muted);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 1rem;
	}

	/* Vote Column */
	.vote-column {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		min-width: 40px;
	}

	.upvote-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: var(--background);
		border: 1px solid var(--border);
		border-radius: 6px;
		color: var(--muted-foreground);
		cursor: pointer;
		transition: all 0.2s;
	}

	.upvote-btn:hover:not(:disabled) {
		border-color: var(--accent);
		color: var(--accent);
	}

	.upvote-btn.upvoted {
		background: var(--accent);
		border-color: var(--accent);
		color: white;
	}

	.upvote-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.upvote-btn.small {
		width: 24px;
		height: 24px;
	}

	.vote-count {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--foreground);
	}

	.vote-count.small {
		font-size: 0.75rem;
	}

	/* Discussion Content */
	.discussion-content {
		flex: 1;
		min-width: 0;
	}

	.discussion-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		color: var(--muted-foreground);
		margin-bottom: 0.5rem;
	}

	.username {
		font-weight: 600;
		color: var(--foreground);
	}

	.separator {
		color: var(--border);
	}

	.discussion-text {
		font-size: 0.9375rem;
		line-height: 1.6;
		color: var(--foreground);
		white-space: pre-wrap;
		word-wrap: break-word;
	}

	.discussion-actions {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-top: 0.75rem;
	}

	.replies-toggle,
	.reply-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.5rem;
		background: transparent;
		border: none;
		border-radius: 4px;
		font-size: 0.8125rem;
		color: var(--muted-foreground);
		cursor: pointer;
		transition: all 0.2s;
	}

	.replies-toggle:hover,
	.reply-btn:hover {
		background: var(--background);
		color: var(--foreground);
	}

	/* Reply Form */
	.reply-form {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--border);
	}

	.reply-form textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid var(--border);
		border-radius: 8px;
		background: var(--background);
		color: var(--foreground);
		font-size: 0.875rem;
		resize: vertical;
		margin-bottom: 0.75rem;
	}

	.reply-form textarea:focus {
		outline: none;
		border-color: var(--accent);
	}

	.reply-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
	}

	/* Replies List */
	.replies-list {
		margin-top: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.reply-card {
		display: flex;
		gap: 0.75rem;
		padding: 0.75rem;
		background: var(--background);
		border-radius: 8px;
		border-left: 2px solid var(--border);
	}

	.reply-vote-column {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.125rem;
	}

	.reply-content {
		flex: 1;
		min-width: 0;
	}

	.loading-replies {
		margin-top: 1rem;
		padding: 1rem;
		text-align: center;
		color: var(--muted-foreground);
		font-size: 0.875rem;
	}

	/* Responsive */
	@media (max-width: 640px) {
		.discussion-card {
			flex-direction: column;
		}

		.vote-column {
			flex-direction: row;
			gap: 0.5rem;
		}
	}
</style>
