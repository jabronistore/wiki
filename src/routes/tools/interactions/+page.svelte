<script lang="ts">
	import SEO from 'sk-seo';
	import { Home, ChevronRight, Plus, X, AlertTriangle, CheckCircle, Clock } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { getItemBySlug } from '$lib/data/unified';
	import type { Peptide, PeptideSummary } from '$lib/types';

	const SITE_URL = 'https://peptide-db.com';

	let {
		data
	}: { data: { allPeptides: PeptideSummary[]; initialPeptides: Peptide[]; initialIds: string[] } } =
		$props();

	let selectedIds = $state<string[]>(data.initialIds.length > 0 ? [...data.initialIds] : ['']);
	let peptides = $state<(Peptide | null)[]>(
		data.initialPeptides.length > 0 ? [...data.initialPeptides] : [null]
	);

	function addSlot() {
		if (selectedIds.length >= 6) return;
		selectedIds = [...selectedIds, ''];
		peptides = [...peptides, null];
	}

	function removeSlot(index: number) {
		if (selectedIds.length <= 1) return;
		selectedIds = selectedIds.filter((_, i) => i !== index);
		peptides = peptides.filter((_, i) => i !== index);
		updateUrl();
	}

	function selectPeptide(index: number, id: string) {
		selectedIds[index] = id;
		peptides[index] = id ? getItemBySlug(id) || null : null;
		updateUrl();
	}

	function updateUrl() {
		if (!browser) return;
		const ids = selectedIds.filter(Boolean);
		if (ids.length > 0) {
			goto(`/tools/interactions?peptides=${ids.join(',')}`, { replaceState: true, noScroll: true });
		} else {
			goto('/tools/interactions', { replaceState: true, noScroll: true });
		}
	}

	// Get all pairwise interactions
	interface PairResult {
		nameA: string;
		nameB: string;
		idA: string;
		idB: string;
		status: string;
		notes: string;
	}

	const pairs = $derived.by(() => {
		const results: PairResult[] = [];
		const loaded = peptides.filter((p): p is Peptide => p !== null);
		if (loaded.length < 2) return results;

		for (let i = 0; i < loaded.length; i++) {
			for (let j = i + 1; j < loaded.length; j++) {
				const pA = loaded[i];
				const pB = loaded[j];

				// Check A's interactions for B
				const fromA = pA.interactions?.find(
					(ix) => ix.peptide.toLowerCase() === pB.name.toLowerCase()
				);
				// Check B's interactions for A
				const fromB = pB.interactions?.find(
					(ix) => ix.peptide.toLowerCase() === pA.name.toLowerCase()
				);

				const match = fromA || fromB;
				results.push({
					nameA: pA.name,
					nameB: pB.name,
					idA: pA.id,
					idB: pB.id,
					status: match?.status || 'unknown',
					notes: match?.notes || 'No interaction data available for this pair.'
				});
			}
		}
		return results;
	});

	const hasConflicts = $derived(pairs.some((p) => p.status === 'avoid'));
	const hasMonitor = $derived(
		pairs.some((p) => p.status === 'monitor' || p.status === 'requires-timing')
	);
	const loadedCount = $derived(peptides.filter((p) => p !== null).length);

	const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
		synergistic: { label: 'Synergistic', color: '#059669', icon: '++' },
		compatible: { label: 'Compatible', color: '#059669', icon: '+' },
		monitor: { label: 'Monitor', color: '#D4A27F', icon: '~' },
		'requires-timing': { label: 'Timing Required', color: '#D4A27F', icon: '%' },
		avoid: { label: 'Avoid', color: '#BF4D43', icon: '!' },
		unknown: { label: 'No Data', color: '#91918D', icon: '?' }
	};

	// Dynamic SEO
	const peptideNames = $derived(
		peptides.filter((p): p is Peptide => p !== null).map((p) => p.name)
	);
	const title = $derived(
		peptideNames.length >= 2
			? `${peptideNames.join(' + ')} Interactions | Peptide Database`
			: 'Peptide Interaction Checker | Peptide Database'
	);
	const description = $derived(
		peptideNames.length >= 2
			? `Check interactions between ${peptideNames.join(', ')}. See compatibility, conflicts, and timing requirements.`
			: 'Check interactions between peptides in your stack. See compatibility, conflicts, and timing requirements for any combination.'
	);
	const canonical = $derived(
		selectedIds.filter(Boolean).length > 0
			? `${SITE_URL}/tools/interactions?peptides=${selectedIds.filter(Boolean).join(',')}`
			: `${SITE_URL}/tools/interactions`
	);

	const jsonld = $derived({
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'WebApplication',
				name: 'Peptide Interaction Checker',
				description: 'Check interactions between peptides in your stack',
				url: `${SITE_URL}/tools/interactions`,
				applicationCategory: 'HealthApplication',
				offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
			},
			{
				'@type': 'BreadcrumbList',
				itemListElement: [
					{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
					{ '@type': 'ListItem', position: 2, name: 'Tools', item: `${SITE_URL}/tools` },
					{
						'@type': 'ListItem',
						position: 3,
						name: 'Interaction Checker',
						item: `${SITE_URL}/tools/interactions`
					}
				]
			}
		]
	});
</script>

<SEO
	{title}
	{description}
	keywords="peptide interactions, peptide stack checker, peptide compatibility, peptide conflicts"
	siteName="Peptide Database"
	{canonical}
	twitter={true}
	openGraph={true}
	schemaOrg={true}
	{jsonld}
/>

<div class="ix-page">
	<!-- Breadcrumb -->
	<nav aria-label="Breadcrumb" class="ix-breadcrumb">
		<ol>
			<li>
				<a href="/"><Home class="h-3.5 w-3.5" /><span>Home</span></a><ChevronRight
					class="sep h-3.5 w-3.5"
				/>
			</li>
			<li><span class="current">Interaction Checker</span></li>
		</ol>
	</nav>

	<header class="ix-header">
		<h1>Interaction Checker</h1>
		<p class="ix-subtitle">
			Add your peptides to check all pairwise interactions, conflicts, and timing requirements.
		</p>
	</header>

	<!-- Peptide selector slots -->
	<div class="ix-selectors">
		{#each selectedIds as id, index}
			<div class="ix-slot">
				<select
					value={id}
					onchange={(e) => selectPeptide(index, (e.target as HTMLSelectElement).value)}
					class="ix-select"
				>
					<option value="">Select peptide...</option>
					{#each data.allPeptides as p}
						<option value={p.id} disabled={selectedIds.includes(p.id) && p.id !== id}
							>{p.name}</option
						>
					{/each}
				</select>
				{#if selectedIds.length > 1}
					<button class="ix-remove" onclick={() => removeSlot(index)} type="button">
						<X class="h-4 w-4" />
					</button>
				{/if}
			</div>
		{/each}
		{#if selectedIds.length < 6}
			<button class="ix-add" onclick={addSlot} type="button">
				<Plus class="h-4 w-4" />
				<span>Add peptide</span>
			</button>
		{/if}
	</div>

	<!-- Results -->
	{#if loadedCount >= 2}
		<!-- Summary banner -->
		{#if hasConflicts}
			<div class="ix-banner ix-banner-danger">
				<AlertTriangle class="h-4 w-4" />
				<span
					>This stack contains interactions marked <strong>avoid</strong>. Review the details below.</span
				>
			</div>
		{:else if hasMonitor}
			<div class="ix-banner ix-banner-warn">
				<Clock class="h-4 w-4" />
				<span>Some interactions require monitoring or timing adjustments.</span>
			</div>
		{:else}
			<div class="ix-banner ix-banner-ok">
				<CheckCircle class="h-4 w-4" />
				<span>No conflicts detected. All interactions are compatible or synergistic.</span>
			</div>
		{/if}

		<!-- Interaction Matrix -->
		{#if loadedCount >= 3}
			{@const loaded = peptides.filter((p) => p !== null)}
			<div class="ix-matrix-wrap">
				<table class="ix-matrix">
					<thead>
						<tr>
							<th></th>
							{#each loaded as p, j}
								{#if j > 0}
									<th class="ix-matrix-col-header">{p?.name}</th>
								{/if}
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each loaded as rowP, i}
							{#if i < loaded.length - 1}
								<tr>
									<td class="ix-matrix-row-header">{rowP?.name}</td>
									{#each loaded as colP, j}
										{#if j > 0}
											{#if j > i}
												{@const fromA = rowP?.interactions?.find(
													(ix) => ix.peptide.toLowerCase() === colP?.name?.toLowerCase()
												)}
												{@const fromB = colP?.interactions?.find(
													(ix) => ix.peptide.toLowerCase() === rowP?.name?.toLowerCase()
												)}
												{@const match = fromA || fromB}
												{@const status = match?.status || 'unknown'}
												{@const config = statusConfig[status]}
												<td>
													<div
														class="ix-matrix-cell"
														style="background: {config.color}"
														title="{rowP?.name} + {colP?.name}: {config.label}{match?.notes
															? ' — ' + match.notes
															: ''}"
													>
														{config.icon}
													</div>
												</td>
											{:else}
												<td></td>
											{/if}
										{/if}
									{/each}
								</tr>
							{/if}
						{/each}
					</tbody>
				</table>
			</div>
		{/if}

		<!-- Pairwise results -->
		<div class="ix-results">
			{#each pairs as pair}
				{@const config = statusConfig[pair.status]}
				<div class="ix-pair" style="--pair-color: {config.color}">
					<div class="ix-pair-header">
						<div class="ix-pair-indicator" style="background: {config.color}">{config.icon}</div>
						<div class="ix-pair-names">
							<a href="/peptides/{pair.idA}" class="ix-pair-name">{pair.nameA}</a>
							<span class="ix-pair-plus">+</span>
							<a href="/peptides/{pair.idB}" class="ix-pair-name">{pair.nameB}</a>
						</div>
						<span class="ix-pair-status" style="color: {config.color}">{config.label}</span>
					</div>
					<p class="ix-pair-notes">{pair.notes}</p>
					<a
						href="/compare/{pair.idA < pair.idB ? pair.idA : pair.idB}-vs-{pair.idA < pair.idB
							? pair.idB
							: pair.idA}"
						class="ix-pair-compare"
					>
						Compare these two
					</a>
				</div>
			{/each}
		</div>
	{:else if loadedCount === 1}
		<div class="ix-empty">Select at least 2 peptides to check interactions.</div>
	{/if}

	<!-- Disclaimer -->
	<div class="ix-disclaimer">
		<AlertTriangle class="h-4 w-4 flex-shrink-0" />
		<p>
			Interaction data is compiled from research literature and community reports. Always consult a
			healthcare professional before combining peptides.
		</p>
	</div>
</div>

<style>
	.ix-page {
		max-width: 48rem;
		margin: 0 auto;
		padding: 1.5rem 1rem 4rem;
	}

	/* Breadcrumb */
	.ix-breadcrumb ol {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		list-style: none;
		padding: 0;
		margin: 0 0 1.5rem;
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
	}
	.ix-breadcrumb li {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}
	.ix-breadcrumb a {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		color: hsl(var(--muted-foreground));
		text-decoration: none;
	}
	.ix-breadcrumb a:hover {
		color: hsl(var(--foreground));
	}
	.ix-breadcrumb .current {
		color: hsl(var(--foreground));
		font-weight: 500;
	}
	.ix-breadcrumb :global(.sep) {
		color: hsl(var(--border));
	}

	.ix-header {
		margin-bottom: 1.5rem;
	}

	.ix-header h1 {
		font-size: 2rem;
		font-weight: 400;
		margin-bottom: 0.5rem;
	}

	.ix-subtitle {
		font-size: 0.9375rem;
		color: hsl(var(--muted-foreground));
	}

	/* Selectors */
	.ix-selectors {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.ix-slot {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.ix-select {
		flex: 1;
		padding: 0.75rem 0.875rem;
		font-size: 0.875rem;
		border: 1.5px solid hsl(var(--border));
		border-radius: 0.625rem;
		background: hsl(var(--background));
		color: hsl(var(--foreground));
		cursor: pointer;
		transition: border-color 0.15s;
	}

	.ix-select:focus {
		outline: none;
		border-color: hsl(var(--accent));
	}

	.ix-remove {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border: 1.5px solid hsl(var(--border));
		border-radius: 0.625rem;
		background: none;
		color: hsl(var(--muted-foreground));
		cursor: pointer;
		transition: all 0.15s;
		flex-shrink: 0;
		-webkit-tap-highlight-color: transparent;
	}

	.ix-remove:hover {
		border-color: hsl(var(--destructive));
		color: hsl(var(--destructive));
	}

	.ix-add {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		padding: 0.625rem;
		border: 1.5px dashed hsl(var(--border));
		border-radius: 0.625rem;
		background: none;
		color: hsl(var(--muted-foreground));
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
		-webkit-tap-highlight-color: transparent;
	}

	.ix-add:hover {
		border-color: hsl(var(--accent));
		color: hsl(var(--accent));
	}

	/* Summary banners */
	.ix-banner {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border-radius: 0.625rem;
		font-size: 0.8125rem;
		margin-bottom: 1.25rem;
	}

	.ix-banner-danger {
		background: hsl(var(--destructive) / 0.08);
		border: 1px solid hsl(var(--destructive) / 0.25);
		color: hsl(var(--destructive));
	}

	.ix-banner-warn {
		background: hsl(30 80% 65% / 0.08);
		border: 1px solid hsl(30 80% 65% / 0.25);
		color: hsl(30 80% 55%);
	}

	.ix-banner-ok {
		background: hsl(142 71% 45% / 0.08);
		border: 1px solid hsl(142 71% 45% / 0.25);
		color: hsl(142 71% 35%);
	}

	/* Interaction Matrix */
	.ix-matrix-wrap {
		overflow-x: auto;
		margin-bottom: 1.5rem;
		padding-bottom: 0.5rem;
	}

	.ix-matrix {
		border-collapse: separate;
		border-spacing: 0.375rem;
	}

	.ix-matrix-col-header {
		font-size: 0.6875rem;
		font-weight: 600;
		color: hsl(var(--muted-foreground));
		text-align: center;
		padding: 0.25rem 0.5rem;
		max-width: 5rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.ix-matrix-row-header {
		font-size: 0.6875rem;
		font-weight: 600;
		color: hsl(var(--muted-foreground));
		text-align: right;
		padding-right: 0.5rem;
		white-space: nowrap;
	}

	.ix-matrix-cell {
		width: 2.75rem;
		height: 2.75rem;
		border-radius: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: 700;
		color: white;
		cursor: default;
		transition: transform 0.1s;
	}

	.ix-matrix-cell:hover {
		transform: scale(1.1);
	}

	/* Pairwise results */
	.ix-results {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.ix-pair {
		padding: 1rem 0;
		border-bottom: 1px solid hsl(var(--border) / 0.3);
	}

	.ix-pair:last-child {
		border-bottom: none;
	}

	.ix-pair-header {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		flex-wrap: wrap;
	}

	.ix-pair-indicator {
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 0.375rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.6875rem;
		font-weight: 700;
		color: white;
		flex-shrink: 0;
	}

	.ix-pair-names {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex: 1;
		min-width: 0;
	}

	.ix-pair-name {
		font-size: 0.9375rem;
		font-weight: 500;
		color: hsl(var(--foreground));
		text-decoration: none;
	}

	.ix-pair-name:hover {
		color: hsl(var(--accent));
	}

	.ix-pair-plus {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
	}

	.ix-pair-status {
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		flex-shrink: 0;
	}

	.ix-pair-notes {
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
		margin-top: 0.375rem;
		line-height: 1.5;
		padding-left: 2.125rem;
	}

	.ix-pair-compare {
		display: inline-block;
		font-size: 0.6875rem;
		font-weight: 500;
		color: hsl(var(--accent));
		text-decoration: none;
		margin-top: 0.375rem;
		padding-left: 2.125rem;
	}

	.ix-pair-compare:hover {
		text-decoration: underline;
	}

	/* Empty state */
	.ix-empty {
		padding: 2rem;
		text-align: center;
		color: hsl(var(--muted-foreground));
		font-size: 0.875rem;
		border: 1.5px dashed hsl(var(--border));
		border-radius: 0.75rem;
	}

	/* Disclaimer */
	.ix-disclaimer {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		margin-top: 2rem;
		padding: 1rem;
		border-radius: 0.75rem;
		background: hsl(var(--muted) / 0.3);
		color: hsl(var(--muted-foreground));
		font-size: 0.8125rem;
	}
</style>
