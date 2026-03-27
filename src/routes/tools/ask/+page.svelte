<script lang="ts">
	import SEO from 'sk-seo';
	import { Home, ChevronRight, Send, RotateCcw, Copy, Check, X } from 'lucide-svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { marked } from 'marked';
	import { getAllItemSummaries } from '$lib/data/unified';
	import { onMount } from 'svelte';
	import { executeRecaptcha, loadRecaptcha } from '$lib/utils/recaptcha';

	const SITE_URL = 'https://peptide-db.com';

	onMount(() => {
		loadRecaptcha();
	});

	// Configure marked
	const renderer = new marked.Renderer();
	renderer.link = ({ href, text }: { href: string; text: string }) => {
		const isInternal = href.startsWith('/');
		const target = isInternal ? '' : ' target="_blank" rel="noopener noreferrer"';
		return `<a href="${href}" class="ai-link"${target}>${text}</a>`;
	};
	marked.setOptions({ renderer, breaks: true });

	// Peptide lookup for link fixing
	const peptideLookup = new Map<string, string>();
	for (const p of getAllItemSummaries()) {
		peptideLookup.set(p.name.toLowerCase(), p.id);
	}

	interface Source {
		name: string;
		href: string;
		type: 'peptide' | 'guide' | 'tool';
	}

	interface Message {
		role: 'user' | 'assistant';
		content: string;
		followUps?: string[];
		sources?: Source[];
	}

	let messages = $state<Message[]>([]);
	let input = $state('');
	let loading = $state(false);
	let streamingContent = $state('');
	let chatContainer = $state<HTMLDivElement | null>(null);
	let inputRef = $state<HTMLTextAreaElement | null>(null);
	let copiedIdx = $state<number | null>(null);
	let sourcePanelOpen = $state(false);
	let activeSources = $state<Source[]>([]);

	const suggestedGroups = [
		{
			label: 'Learn',
			questions: [
				'What is the difference between BPC-157 and TB-500?',
				'Which peptides are best for healing?'
			]
		},
		{
			label: 'Dosing',
			questions: [
				'How do I reconstitute a 10mg vial of semaglutide?',
				'What is the KLOW protocol and how is it dosed?'
			]
		},
		{
			label: 'Safety',
			questions: [
				'What are the side effects of retatrutide?',
				'Which peptides should not be combined?'
			]
		}
	];

	onMount(() => {
		const q = $page.url.searchParams.get('q');
		if (q) sendMessage(q);
	});

	function scrollToBottom() {
		if (chatContainer) {
			requestAnimationFrame(() => {
				chatContainer!.scrollTop = chatContainer!.scrollHeight;
			});
		}
	}

	function fixLinks(text: string): string {
		text = text.replace(/\[([^\]]+)\]\(\/([a-z0-9-]+)\)/g, (match, name, slug) => {
			if (/^(guides|calculator|compare|tools|peptides|categories)/.test(slug)) return match;
			return `[${name}](/peptides/${slug})`;
		});
		text = text.replace(/(\w[\w\s-]*?)\s*\(\/([a-z0-9-]+)\)/g, (match, name, slug) => {
			if (/^(guides|calculator|compare|tools|peptides)/.test(slug))
				return `[${name.trim()}](/${slug})`;
			return `[${name.trim()}](/peptides/${slug})`;
		});
		return text;
	}

	function extractSources(text: string): Source[] {
		const sources: Source[] = [];
		const seen = new Set<string>();
		const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
		let match;
		while ((match = linkRegex.exec(text)) !== null) {
			const href = match[2];
			if (seen.has(href)) continue;
			seen.add(href);
			let type: Source['type'] = 'tool';
			if (href.startsWith('/peptides/')) type = 'peptide';
			else if (href.startsWith('/guides/')) type = 'guide';
			if (href.startsWith('/')) {
				sources.push({ name: match[1], href, type });
			}
		}
		return sources;
	}

	function extractFollowUps(text: string): { clean: string; followUps: string[] } {
		const idx = text.indexOf('FOLLOW_UP:');
		if (idx === -1) return { clean: text, followUps: [] };
		const clean = text.substring(0, idx).trim();
		const raw = text.substring(idx + 10).trim();
		const followUps = raw
			.split('|')
			.map((q) => q.trim())
			.filter((q) => q.length > 5);
		return { clean, followUps };
	}

	function renderMarkdown(text: string): string {
		return marked.parse(fixLinks(text)) as string;
	}

	async function sendMessage(question?: string) {
		const q = (question || input).trim();
		if (!q || loading) return;

		messages = [...messages, { role: 'user', content: q }];
		input = '';
		loading = true;
		streamingContent = '';
		sourcePanelOpen = false;
		scrollToBottom();
		if (inputRef) inputRef.style.height = 'auto';

		try {
			let recaptchaToken = '';
			try {
				recaptchaToken = await executeRecaptcha('ask_ai');
			} catch {
				recaptchaToken = '';
			}

			const res = await fetch('/api/ask', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ question: q, history: messages.slice(0, -1), recaptchaToken })
			});

			if (!res.ok) {
				let errorMsg = 'Something went wrong. Please try again.';
				if (res.status === 429 || res.status === 403)
					errorMsg = 'Too many requests. Please wait a moment.';
				else {
					const err = await res.json().catch(() => null);
					if (err?.error) errorMsg = err.error;
				}
				messages = [...messages, { role: 'assistant', content: errorMsg }];
				loading = false;
				return;
			}

			const reader = res.body?.getReader();
			if (!reader) {
				messages = [...messages, { role: 'assistant', content: 'Error: Stream not available' }];
				loading = false;
				return;
			}

			const decoder = new TextDecoder();
			let accumulated = '';

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				for (const line of decoder.decode(value).split('\n')) {
					if (!line.startsWith('data: ')) continue;
					const data = line.slice(6);
					if (data === '[DONE]') break;
					try {
						const parsed = JSON.parse(data);
						if (parsed.text) {
							accumulated += parsed.text;
							streamingContent = accumulated;
							scrollToBottom();
						}
					} catch {}
				}
			}

			const { clean, followUps } = extractFollowUps(accumulated);
			const fixed = fixLinks(clean);
			const sources = extractSources(fixed);

			messages = [...messages, { role: 'assistant', content: clean, followUps, sources }];
			streamingContent = '';

			if (sources.length > 0) {
				activeSources = sources;
				sourcePanelOpen = true;
			}
		} catch {
			messages = [
				...messages,
				{ role: 'assistant', content: 'Error: Network error. Please try again.' }
			];
		}
		loading = false;
		scrollToBottom();
	}

	function clearChat() {
		messages = [];
		streamingContent = '';
		input = '';
		sourcePanelOpen = false;
		activeSources = [];
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	}

	function autoResize(e: Event) {
		const el = e.target as HTMLTextAreaElement;
		el.style.height = 'auto';
		el.style.height = Math.min(el.scrollHeight, 120) + 'px';
	}

	async function copyMessage(idx: number) {
		const msg = messages[idx];
		if (!msg || msg.role !== 'assistant') return;
		await navigator.clipboard.writeText(msg.content);
		copiedIdx = idx;
		setTimeout(() => {
			copiedIdx = null;
		}, 2000);
	}

	function showSources(sources: Source[]) {
		activeSources = sources;
		sourcePanelOpen = true;
	}
</script>

<SEO
	title="Ask AI | Peptide Database"
	description="Ask questions about peptides and get instant, research-grounded answers from our database of 90+ peptides."
	keywords="peptide AI, ask about peptides, peptide chatbot, peptide questions"
	siteName="Peptide Database"
	canonical="{SITE_URL}/tools/ask"
	twitter={true}
	openGraph={true}
/>

<div class="ask-page">
	<nav aria-label="Breadcrumb" class="ask-bc">
		<ol>
			<li>
				<a href="/"><Home class="h-3.5 w-3.5" /><span>Home</span></a><ChevronRight
					class="sep h-3.5 w-3.5"
				/>
			</li>
			<li><span class="current">Ask AI</span></li>
		</ol>
	</nav>

	<div class="ask-layout" class:ask-layout-panel={sourcePanelOpen}>
		<!-- Chat -->
		<div class="chat-panel">
			<div class="chat-scroll" bind:this={chatContainer}>
				{#if messages.length === 0 && !loading}
					<div class="chat-empty">
						<h1 class="empty-title">Ask about peptides</h1>
						<p class="empty-desc">
							Answers grounded in 90+ peptide profiles, dosing protocols, and research references.
						</p>
						<div class="suggestion-groups">
							{#each suggestedGroups as group}
								<div class="suggestion-group">
									<span class="suggestion-label">{group.label}</span>
									{#each group.questions as q}
										<button class="suggestion-btn" onclick={() => sendMessage(q)}>{q}</button>
									{/each}
								</div>
							{/each}
						</div>
					</div>
				{:else}
					<div class="chat-messages">
						{#each messages as msg, i}
							<div class="msg msg-{msg.role}">
								{#if msg.role === 'user'}
									<div class="msg-bubble-user">{msg.content}</div>
								{:else}
									<div class="msg-ai-wrap">
										<div class="msg-ai-content">{@html renderMarkdown(msg.content)}</div>
										<div class="msg-actions">
											<button class="msg-action" onclick={() => copyMessage(i)} title="Copy">
												{#if copiedIdx === i}
													<Check class="h-3.5 w-3.5" />
												{:else}
													<Copy class="h-3.5 w-3.5" />
												{/if}
											</button>
											{#if msg.sources && msg.sources.length > 0}
												<button
													class="msg-action msg-action-sources"
													onclick={() => showSources(msg.sources || [])}
												>
													{msg.sources.length} source{msg.sources.length !== 1 ? 's' : ''}
												</button>
											{/if}
										</div>
										{#if msg.followUps && msg.followUps.length > 0}
											<div class="follow-ups">
												{#each msg.followUps as fu}
													<button class="follow-up-btn" onclick={() => sendMessage(fu)}>{fu}</button
													>
												{/each}
											</div>
										{/if}
									</div>
								{/if}
							</div>
						{/each}
						{#if streamingContent}
							<div class="msg msg-assistant">
								<div class="msg-ai-wrap">
									<div class="msg-ai-content">{@html renderMarkdown(streamingContent)}</div>
								</div>
							</div>
						{/if}
						{#if loading && !streamingContent}
							<div class="msg msg-assistant">
								<div class="msg-loading"><span></span><span></span><span></span></div>
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Input -->
			<div class="chat-input-area">
				<div class="chat-input-box">
					{#if messages.length > 0}
						<button class="input-action" onclick={clearChat} title="Clear"
							><RotateCcw class="h-4 w-4" /></button
						>
					{/if}
					<textarea
						bind:this={inputRef}
						bind:value={input}
						onkeydown={handleKeydown}
						oninput={autoResize}
						placeholder="Ask about any peptide..."
						class="chat-input"
						rows="1"
						disabled={loading}
					></textarea>
					<button
						class="send-btn"
						onclick={() => sendMessage()}
						disabled={!input.trim() || loading}
					>
						<Send class="h-4 w-4" />
					</button>
				</div>
				<p class="disclaimer">
					Powered by Gemini. Answers from peptide-db.com data. Not medical advice.
				</p>
			</div>
		</div>

		<!-- Sources panel (desktop: right side, mobile: bottom sheet) -->
		{#if sourcePanelOpen && activeSources.length > 0}
			<div class="sources-panel">
				<div class="sources-header">
					<span class="sources-title">Sources</span>
					<button class="sources-close" onclick={() => (sourcePanelOpen = false)}
						><X class="h-4 w-4" /></button
					>
				</div>
				<div class="sources-list">
					{#each activeSources as source}
						<a href={source.href} class="source-card">
							<span class="source-type">{source.type}</span>
							<span class="source-name">{source.name}</span>
						</a>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.ask-page {
		max-width: 72rem;
		margin: 0 auto;
		padding: 1rem 1rem 0;
		height: calc(100dvh - 4rem);
		display: flex;
		flex-direction: column;
	}

	.ask-bc ol {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		list-style: none;
		padding: 0;
		margin: 0 0 0.75rem;
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
	}
	.ask-bc li {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}
	.ask-bc a {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		color: hsl(var(--muted-foreground));
		text-decoration: none;
	}
	.ask-bc a:hover {
		color: hsl(var(--foreground));
	}
	.ask-bc .current {
		color: hsl(var(--foreground));
		font-weight: 500;
	}
	.ask-bc :global(.sep) {
		color: hsl(var(--border));
	}

	/* Layout: chat + optional sources panel */
	.ask-layout {
		flex: 1;
		min-height: 0;
		display: flex;
		gap: 0.75rem;
	}

	.chat-panel {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;
		min-width: 0;
		border: 1px solid hsl(var(--border));
		border-radius: 0.75rem;
		overflow: hidden;
		background: hsl(var(--background));
	}

	.chat-scroll {
		flex: 1;
		overflow-y: auto;
		overscroll-behavior: contain;
		padding: 1.5rem;
	}

	.chat-scroll::-webkit-scrollbar {
		width: 4px;
	}
	.chat-scroll::-webkit-scrollbar-thumb {
		background: hsl(var(--border));
		border-radius: 2px;
	}

	/* Empty state */
	.chat-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		min-height: 100%;
		padding: 2rem 0;
	}

	.empty-title {
		font-size: 1.75rem;
		font-weight: 400;
		margin-bottom: 0.5rem;
	}
	.empty-desc {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		max-width: 28rem;
		margin-bottom: 2rem;
	}

	.suggestion-groups {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
		max-width: 28rem;
	}
	.suggestion-group {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.suggestion-label {
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: hsl(var(--muted-foreground) / 0.5);
		padding-left: 0.125rem;
	}

	.suggestion-btn {
		padding: 0.5rem 0.875rem;
		font-size: 0.8125rem;
		color: hsl(var(--foreground));
		background: transparent;
		border: 1px solid hsl(var(--border));
		border-radius: 0.5rem;
		cursor: pointer;
		text-align: left;
		transition: all 0.1s;
		-webkit-tap-highlight-color: transparent;
	}
	.suggestion-btn:hover {
		border-color: hsl(var(--accent) / 0.5);
		background: hsl(var(--accent) / 0.04);
	}

	/* Messages */
	.chat-messages {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	.msg-user {
		display: flex;
		justify-content: flex-end;
	}
	.msg-assistant {
		display: flex;
		justify-content: flex-start;
	}

	.msg-bubble-user {
		max-width: 80%;
		padding: 0.625rem 1rem;
		background: hsl(var(--accent));
		color: white;
		border-radius: 1rem 1rem 0.25rem 1rem;
		font-size: 0.875rem;
		line-height: 1.5;
	}

	.msg-ai-wrap {
		max-width: 100%;
	}

	.msg-ai-content {
		font-size: 0.875rem;
		line-height: 1.7;
		color: hsl(var(--foreground));
	}

	.msg-ai-content :global(p) {
		margin: 0 0 0.75rem;
	}
	.msg-ai-content :global(p:last-child) {
		margin-bottom: 0;
	}
	.msg-ai-content :global(strong) {
		font-weight: 600;
	}
	.msg-ai-content :global(.ai-link) {
		color: hsl(var(--accent));
		text-decoration: none;
		font-weight: 500;
		border-bottom: 1px solid hsl(var(--accent) / 0.3);
	}
	.msg-ai-content :global(.ai-link:hover) {
		border-bottom-color: hsl(var(--accent));
	}
	.msg-ai-content :global(ul),
	.msg-ai-content :global(ol) {
		margin: 0.5rem 0;
		padding-left: 1.25rem;
	}
	.msg-ai-content :global(li) {
		margin-bottom: 0.25rem;
	}
	.msg-ai-content :global(code) {
		font-family: var(--font-mono);
		font-size: 0.8125rem;
		background: hsl(var(--muted));
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
	}
	.msg-ai-content :global(h1),
	.msg-ai-content :global(h2),
	.msg-ai-content :global(h3) {
		font-size: 1rem;
		font-weight: 600;
		margin: 1rem 0 0.5rem;
	}
	.msg-ai-content :global(table) {
		width: 100%;
		border-collapse: collapse;
		margin: 0.75rem 0;
		font-size: 0.8125rem;
	}
	.msg-ai-content :global(th),
	.msg-ai-content :global(td) {
		padding: 0.375rem 0.625rem;
		border: 1px solid hsl(var(--border));
		text-align: left;
	}
	.msg-ai-content :global(th) {
		background: hsl(var(--muted) / 0.5);
		font-weight: 600;
		font-size: 0.75rem;
	}
	.msg-ai-content :global(blockquote) {
		border-left: 3px solid hsl(var(--accent));
		padding-left: 0.875rem;
		margin: 0.75rem 0;
		color: hsl(var(--muted-foreground));
	}

	/* Message actions (copy, sources) */
	.msg-actions {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		margin-top: 0.5rem;
	}

	.msg-action {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		border: 1px solid hsl(var(--border));
		background: transparent;
		color: hsl(var(--muted-foreground));
		font-size: 0.6875rem;
		cursor: pointer;
		transition: all 0.1s;
		-webkit-tap-highlight-color: transparent;
	}
	.msg-action:hover {
		color: hsl(var(--foreground));
		border-color: hsl(var(--foreground) / 0.3);
	}

	.msg-action-sources {
		color: hsl(var(--accent));
		border-color: hsl(var(--accent) / 0.3);
	}
	.msg-action-sources:hover {
		background: hsl(var(--accent) / 0.06);
	}

	/* Follow-up suggestions */
	.follow-ups {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		margin-top: 0.75rem;
	}

	.follow-up-btn {
		padding: 0.375rem 0.75rem;
		font-size: 0.75rem;
		font-weight: 400;
		color: hsl(var(--accent));
		background: transparent;
		border: 1px solid hsl(var(--accent) / 0.3);
		border-radius: 999px;
		cursor: pointer;
		transition: all 0.1s;
		-webkit-tap-highlight-color: transparent;
	}
	.follow-up-btn:hover {
		background: hsl(var(--accent) / 0.06);
		border-color: hsl(var(--accent) / 0.5);
	}

	/* Loading */
	.msg-loading {
		display: flex;
		gap: 0.25rem;
		padding: 0.5rem 0;
	}
	.msg-loading span {
		width: 0.375rem;
		height: 0.375rem;
		border-radius: 50%;
		background: hsl(var(--muted-foreground));
		animation: dot-b 1.2s ease-in-out infinite;
	}
	.msg-loading span:nth-child(2) {
		animation-delay: 0.15s;
	}
	.msg-loading span:nth-child(3) {
		animation-delay: 0.3s;
	}
	@keyframes dot-b {
		0%,
		60%,
		100% {
			opacity: 0.3;
			transform: translateY(0);
		}
		30% {
			opacity: 1;
			transform: translateY(-3px);
		}
	}

	/* Input area */
	.chat-input-area {
		padding: 0.75rem;
		padding-bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px));
		border-top: 1px solid hsl(var(--border));
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.chat-input-box {
		display: flex;
		align-items: flex-end;
		gap: 0.5rem;
	}

	.input-action {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 0.625rem;
		border: 1.5px solid hsl(var(--border));
		background: transparent;
		color: hsl(var(--muted-foreground));
		cursor: pointer;
		flex-shrink: 0;
		transition: all 0.1s;
		-webkit-tap-highlight-color: transparent;
	}
	.input-action:hover {
		color: hsl(var(--foreground));
		border-color: hsl(var(--foreground) / 0.3);
	}

	.chat-input {
		flex: 1;
		padding: 0.625rem 0.875rem;
		font-size: 1rem;
		font-family: inherit;
		color: hsl(var(--foreground));
		background: hsl(var(--muted) / 0.3);
		border: 1.5px solid hsl(var(--border));
		border-radius: 0.625rem;
		outline: none;
		resize: none;
		line-height: 1.5;
		min-height: 2.5rem;
		max-height: 7.5rem;
		transition: border-color 0.15s;
	}
	.chat-input:focus {
		border-color: hsl(var(--accent));
	}
	.chat-input::placeholder {
		color: hsl(var(--muted-foreground) / 0.6);
	}
	.chat-input:disabled {
		opacity: 0.5;
	}

	.send-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 0.625rem;
		border: none;
		background: hsl(var(--accent));
		color: white;
		cursor: pointer;
		flex-shrink: 0;
		transition: opacity 0.1s;
		-webkit-tap-highlight-color: transparent;
	}
	.send-btn:hover {
		opacity: 0.85;
	}
	.send-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.disclaimer {
		font-size: 0.625rem;
		color: hsl(var(--muted-foreground) / 0.5);
		text-align: center;
	}

	/* Sources panel — desktop: right column */
	.sources-panel {
		width: 18rem;
		flex-shrink: 0;
		border: 1px solid hsl(var(--border));
		border-radius: 0.75rem;
		background: hsl(var(--background));
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.sources-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid hsl(var(--border));
	}

	.sources-title {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: hsl(var(--muted-foreground));
	}

	.sources-close {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 0.25rem;
		border: none;
		background: transparent;
		color: hsl(var(--muted-foreground));
		cursor: pointer;
		transition: color 0.1s;
	}
	.sources-close:hover {
		color: hsl(var(--foreground));
	}

	.sources-list {
		flex: 1;
		overflow-y: auto;
		padding: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.source-card {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		padding: 0.625rem 0.75rem;
		border-radius: 0.5rem;
		border: 1px solid hsl(var(--border));
		text-decoration: none;
		transition: all 0.1s;
	}
	.source-card:hover {
		border-color: hsl(var(--accent) / 0.5);
		background: hsl(var(--accent) / 0.04);
	}

	.source-type {
		font-size: 0.5rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: hsl(var(--muted-foreground) / 0.5);
	}

	.source-name {
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--foreground));
	}

	/* Mobile: sources as bottom sheet */
	@media (max-width: 768px) {
		.ask-page {
			padding: 0.75rem 0.75rem 0;
			max-width: 100%;
		}
		.ask-layout {
			flex-direction: column;
		}
		.empty-title {
			font-size: 1.25rem;
		}

		.sources-panel {
			width: 100%;
			max-height: 40vh;
			border-radius: 0.75rem 0.75rem 0 0;
			border-bottom: none;
		}

		.msg-bubble-user {
			max-width: 90%;
		}
	}
</style>
