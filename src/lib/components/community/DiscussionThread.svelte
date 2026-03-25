<script lang="ts">
	import { ChevronUp, ChevronDown, ChevronRight, Reply } from 'lucide-svelte';
	import type { Database } from '$lib/types/database';
	import Self from './DiscussionThread.svelte';

	type Discussion = Database['public']['Tables']['discussions']['Row'] & {
		profiles: { username: string } | null;
	};

	interface Props {
		discussion: Discussion;
		user: { id: string } | null;
		profile: { username: string } | null;
		userUpvotes: Set<string>;
		peptideId: string;
		depth?: number;
		onUpvote: (discussionId: string) => void;
		onReplyCountUpdate: (discussionId: string, delta: number) => void;
	}

	let {
		discussion,
		user,
		profile,
		userUpvotes,
		peptideId,
		depth = 0,
		onUpvote,
		onReplyCountUpdate
	}: Props = $props();

	const MAX_DEPTH = 10;

	let isExpanded = $state(false);
	let isReplying = $state(false);
	let replyContent = $state('');
	let isSubmittingReply = $state(false);
	let loadedReplies = $state<Discussion[]>([]);
	let isLoadingReplies = $state(false);
	let hasLoadedReplies = $state(false);
	let localReplyCount = $state(discussion.reply_count);

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

	async function toggleReplies() {
		if (localReplyCount === 0) return;

		if (isExpanded) {
			isExpanded = false;
			return;
		}

		if (!hasLoadedReplies) {
			isLoadingReplies = true;
			try {
				const response = await fetch(`/api/discussions?parentId=${discussion.id}`);
				const result = await response.json();
				if (response.ok) {
					loadedReplies = result.discussions;
					hasLoadedReplies = true;
				}
			} catch (e) {
				console.error('Failed to load replies:', e);
			} finally {
				isLoadingReplies = false;
			}
		}

		isExpanded = true;
	}

	async function submitReply() {
		if (!replyContent.trim() || !user) return;

		isSubmittingReply = true;

		try {
			const response = await fetch('/api/discussions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					peptideId,
					content: replyContent.trim(),
					parentId: discussion.id
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to reply');
			}

			// Add reply to loaded replies
			const newReply = {
				...result.discussion,
				profiles: { username: profile?.username || 'Unknown' }
			};

			loadedReplies = [...loadedReplies, newReply];
			hasLoadedReplies = true;
			localReplyCount += 1;
			isExpanded = true;

			// Notify parent about reply count change
			onReplyCountUpdate(discussion.id, 1);

			replyContent = '';
			isReplying = false;
		} catch (e) {
			console.error('Reply error:', e);
		} finally {
			isSubmittingReply = false;
		}
	}

	function handleNestedReplyCountUpdate(discussionId: string, delta: number) {
		// Update the reply in our loaded replies
		loadedReplies = loadedReplies.map((r) =>
			r.id === discussionId ? { ...r, reply_count: r.reply_count + delta } : r
		);
	}
</script>

<div class="thread" style="--depth: {depth}">
	<div class="thread-main">
		<div class="vote-column">
			<button
				class="upvote-btn"
				class:upvoted={userUpvotes.has(discussion.id)}
				onclick={() => onUpvote(discussion.id)}
				disabled={!user}
				title={user
					? userUpvotes.has(discussion.id)
						? 'Remove upvote'
						: 'Upvote'
					: 'Log in to upvote'}
			>
				<ChevronUp class="h-4 w-4" />
			</button>
			<span class="vote-count">{discussion.upvote_count}</span>
		</div>

		<div class="thread-content">
			<div class="thread-meta">
				<span class="username">{discussion.profiles?.username || 'Unknown'}</span>
				<span class="separator">·</span>
				<time datetime={discussion.created_at}>{formatDate(discussion.created_at)}</time>
			</div>

			<p class="thread-text">{discussion.content}</p>

			<div class="thread-actions">
				{#if localReplyCount > 0}
					<button class="action-btn" onclick={toggleReplies}>
						{#if isExpanded}
							<ChevronDown class="h-4 w-4" />
						{:else}
							<ChevronRight class="h-4 w-4" />
						{/if}
						{localReplyCount}
						{localReplyCount === 1 ? 'reply' : 'replies'}
					</button>
				{/if}

				{#if user && depth < MAX_DEPTH}
					<button class="action-btn" onclick={() => (isReplying = !isReplying)}>
						<Reply class="h-4 w-4" />
						Reply
					</button>
				{/if}
			</div>

			<!-- Reply Form -->
			{#if isReplying}
				<div class="reply-form">
					<textarea
						bind:value={replyContent}
						placeholder="Write a reply..."
						rows="3"
						disabled={isSubmittingReply}
					></textarea>
					<div class="reply-actions">
						<button class="btn-cancel" onclick={() => (isReplying = false)}>Cancel</button>
						<button
							class="btn-submit"
							onclick={submitReply}
							disabled={isSubmittingReply || !replyContent.trim()}
						>
							{isSubmittingReply ? 'Posting...' : 'Reply'}
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Nested Replies -->
	{#if isExpanded}
		{#if isLoadingReplies}
			<div class="loading">Loading replies...</div>
		{:else if loadedReplies.length > 0}
			<div class="replies">
				{#each loadedReplies as reply (reply.id)}
					<Self
						discussion={reply}
						{user}
						{profile}
						{userUpvotes}
						{peptideId}
						depth={depth + 1}
						{onUpvote}
						onReplyCountUpdate={handleNestedReplyCountUpdate}
					/>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<style>
	.thread {
		--indent: calc(var(--depth) * 1rem);
	}

	.thread-main {
		display: flex;
		gap: 0.75rem;
		padding: 0.75rem;
		background: hsl(var(--muted));
		border-radius: 8px;
		margin-left: var(--indent);
	}

	.vote-column {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.125rem;
	}

	.upvote-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		background: hsl(var(--background));
		border: 1px solid hsl(var(--border));
		border-radius: 6px;
		color: hsl(var(--muted-foreground));
		cursor: pointer;
		transition: all 0.2s;
	}

	.upvote-btn:hover:not(:disabled) {
		border-color: hsl(var(--accent));
		color: hsl(var(--accent));
	}

	.upvote-btn.upvoted {
		background: hsl(var(--accent));
		border-color: hsl(var(--accent));
		color: white;
	}

	.upvote-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.vote-count {
		font-size: 0.75rem;
		font-weight: 600;
		color: hsl(var(--foreground));
	}

	.thread-content {
		flex: 1;
		min-width: 0;
	}

	.thread-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
		margin-bottom: 0.375rem;
	}

	.username {
		font-weight: 600;
		color: hsl(var(--foreground));
	}

	.separator {
		color: hsl(var(--border));
	}

	.thread-text {
		font-size: 0.9375rem;
		line-height: 1.6;
		color: hsl(var(--foreground));
		white-space: pre-wrap;
		word-wrap: break-word;
		margin: 0;
	}

	.thread-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	.action-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.5rem;
		background: transparent;
		border: none;
		border-radius: 4px;
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
		cursor: pointer;
		transition: all 0.2s;
	}

	.action-btn:hover {
		background: hsl(var(--background));
		color: hsl(var(--foreground));
	}

	/* Reply Form */
	.reply-form {
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid hsl(var(--border));
	}

	.reply-form textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid hsl(var(--border));
		border-radius: 8px;
		background: hsl(var(--background));
		color: hsl(var(--foreground));
		font-size: 0.875rem;
		font-family: inherit;
		resize: vertical;
		margin-bottom: 0.5rem;
	}

	.reply-form textarea:focus {
		outline: none;
		border-color: hsl(var(--accent));
	}

	.reply-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
	}

	.btn-cancel {
		padding: 0.5rem 0.75rem;
		background: transparent;
		border: 1px solid hsl(var(--border));
		border-radius: 6px;
		color: hsl(var(--foreground));
		font-size: 0.875rem;
		cursor: pointer;
	}

	.btn-submit {
		padding: 0.5rem 1rem;
		background: hsl(var(--accent));
		border: none;
		border-radius: 6px;
		color: white;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: opacity 0.2s;
	}

	.btn-submit:hover:not(:disabled) {
		opacity: 0.9;
	}

	.btn-submit:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Nested Replies */
	.replies {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-top: 0.5rem;
		padding-left: 0.5rem;
		border-left: 2px solid hsl(var(--border) / 0.5);
		margin-left: calc(var(--indent) + 0.75rem);
	}

	.loading {
		margin-top: 0.75rem;
		margin-left: calc(var(--indent) + 1rem);
		padding: 0.75rem;
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
	}

	/* Mobile adjustments */
	@media (max-width: 640px) {
		.thread-main {
			flex-direction: column;
			gap: 0.5rem;
		}

		.vote-column {
			flex-direction: row;
			gap: 0.5rem;
		}

		.replies {
			margin-left: 0.5rem;
			padding-left: 0.5rem;
		}
	}
</style>
