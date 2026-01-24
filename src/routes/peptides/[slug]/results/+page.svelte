<script lang="ts">
	import {
		BarChart3,
		Users,
		Clock,
		ThumbsUp,
		Calendar,
		Syringe,
		ChevronDown,
		ChevronUp,
		FlaskConical,
		AlertTriangle,
		TrendingUp,
		Star,
		Target,
		Shield,
		Repeat,
		Activity,
		Pill,
		Sparkles,
		Moon,
		Utensils,
		Dumbbell,
		Brain
	} from 'lucide-svelte';
	import type { PageData } from './$types';
	import type { Peptide } from '$lib/types';
	import type { Database } from '$lib/types/database';

	type AnonymousFinding = Database['public']['Views']['findings_anonymous']['Row'];
	type DosingPhase = Database['public']['Tables']['finding_dosing_phases']['Row'];
	type SideEffect = Database['public']['Tables']['finding_side_effects']['Row'];
	type FindingResult = Database['public']['Tables']['finding_results']['Row'];
	type ConcurrentCompound = Database['public']['Tables']['finding_concurrent_compounds']['Row'];
	type CustomResult = Database['public']['Tables']['finding_custom_results']['Row'];

	let { data }: { data: PageData } = $props();
	const peptide = data.peptide as Peptide;
	const findings = data.findings as AnonymousFinding[];
	const dosingPhases = data.dosingPhases as Record<string, DosingPhase[]>;
	const sideEffects = data.sideEffects as Record<string, SideEffect[]>;
	const results = data.results as Record<string, FindingResult>;
	const concurrentCompounds = data.concurrentCompounds as Record<string, ConcurrentCompound[]>;
	const customResults = data.customResults as Record<string, CustomResult[]>;
	const aggregateStats = data.aggregateStats;

	let expandedFindings = $state<Record<string, boolean>>({});
	let showLifestylePanel = $state(false);
	let showDosingPatterns = $state(false);

	function toggleFinding(id: string) {
		expandedFindings = {
			...expandedFindings,
			[id]: !expandedFindings[id]
		};
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function getAdminMethodLabel(method: string) {
		const methods: Record<string, string> = {
			subq: 'Subcutaneous',
			im: 'Intramuscular',
			oral: 'Oral',
			nasal: 'Nasal',
			topical: 'Topical'
		};
		return methods[method] || method;
	}

	function getFrequencyLabel(freq: string) {
		const frequencies: Record<string, string> = {
			once_daily: 'Once daily',
			twice_daily: 'Twice daily',
			three_times_daily: '3x daily',
			weekly: 'Weekly',
			twice_weekly: 'Twice weekly',
			three_times_weekly: '3x weekly',
			every_other_day: 'Every other day',
			as_needed: 'As needed'
		};
		return frequencies[freq] || freq;
	}

	function getTimeOfDayLabel(time: string) {
		const labels: Record<string, string> = {
			morning: 'Morning',
			midday: 'Midday',
			evening: 'Evening',
			bedtime: 'Bedtime',
			split: 'Split doses'
		};
		return labels[time] || time;
	}

	function getMealTimingLabel(timing: string) {
		const labels: Record<string, string> = {
			fasted: 'Fasted',
			with_food: 'With food',
			before_food: 'Before food',
			after_food: 'After food'
		};
		return labels[timing] || timing;
	}

	function getWhyStoppedLabel(reason: string) {
		const labels: Record<string, string> = {
			achieved_goals: 'Achieved goals',
			side_effects: 'Side effects',
			cost: 'Cost',
			availability: 'Availability',
			planned_end: 'Planned end',
			other: 'Other'
		};
		return labels[reason] || reason;
	}

	function getEffectPersistenceLabel(persistence: string) {
		const labels: Record<string, string> = {
			ongoing: 'Still ongoing',
			less_than_week: '< 1 week',
			'1_to_4_weeks': '1-4 weeks',
			'1_to_3_months': '1-3 months',
			more_than_3_months: '> 3 months'
		};
		return labels[persistence] || persistence;
	}

	function getDataConfidenceLabel(confidence: string) {
		const labels: Record<string, string> = {
			very_confident: 'Very confident',
			somewhat_confident: 'Somewhat confident',
			some_uncertainty: 'Some uncertainty',
			significant_guessing: 'Significant guessing'
		};
		return labels[confidence] || confidence;
	}

	function getOnsetTimingLabel(timing: string) {
		const labels: Record<string, string> = {
			immediate: 'Immediate',
			early: 'Early (1st week)',
			delayed: 'Delayed (>1 week)'
		};
		return labels[timing] || timing;
	}

	function getResolutionLabel(resolved: string) {
		const labels: Record<string, string> = {
			yes_while_continuing: 'Resolved (continued use)',
			yes_after_stopping: 'Resolved (after stopping)',
			no_ongoing: 'Ongoing',
			not_applicable: 'N/A'
		};
		return labels[resolved] || resolved;
	}

	function getInjectionSiteLabel(site: string) {
		const labels: Record<string, string> = {
			abdomen: 'Abdomen',
			love_handles: 'Love handles',
			thigh: 'Thigh',
			deltoid: 'Deltoid',
			gluteal: 'Gluteal',
			vastus_lateralis: 'Vastus lateralis',
			rotated: 'Rotated sites'
		};
		return labels[site] || site;
	}

	function getSourceTypeLabel(source: string) {
		const labels: Record<string, string> = {
			compounding_pharmacy: 'Compounding pharmacy',
			research_supplier: 'Research supplier',
			other: 'Other',
			prefer_not_say: 'Prefer not to say'
		};
		return labels[source] || source;
	}

	// Create a simplified bar chart using CSS
	function getBarWidth(count: number, max: number): string {
		if (max === 0) return '0%';
		return `${(count / max) * 100}%`;
	}

	// NPS color class
	function getNpsColorClass(score: number): string {
		if (score >= 50) return 'nps-excellent';
		if (score >= 0) return 'nps-good';
		return 'nps-poor';
	}

	// NPS bar color based on score position
	function getNpsBarClass(score: number): string {
		if (score >= 9) return 'nps-promoter';
		if (score >= 7) return 'nps-passive';
		return 'nps-detractor';
	}

	const maxEffectivenessCount = Math.max(
		...aggregateStats.effectivenessDistribution.map((d: { count: number }) => d.count),
		1
	);

	const maxNpsCount = Math.max(
		...aggregateStats.npsDistribution.map((d: { count: number }) => d.count),
		1
	);

	// Check if we have enough data to show various sections
	const hasNpsData = aggregateStats.npsDistribution.some((d: { count: number }) => d.count > 0);
	const hasLifestyleData =
		Object.keys(aggregateStats.lifestyleStats.training).length > 0 ||
		Object.keys(aggregateStats.lifestyleStats.sleep).length > 0;
	const hasConcurrentCompounds = aggregateStats.topConcurrentCompounds.length > 0;
	const hasCustomEffects = aggregateStats.topCustomEffects.length > 0;
	const hasEffectPersistence = Object.keys(aggregateStats.effectPersistenceDistribution).length > 0;
	const hasSideEffectsAnalysis = aggregateStats.sideEffectsAnalysis.topSideEffects.length > 0;
	const hasDosingPatterns =
		Object.keys(aggregateStats.dosingPatterns.timeOfDayDistribution).length > 0;
</script>

<svelte:head>
	<title>Community Results - {peptide.name} | PepPedia</title>
	<meta
		name="description"
		content="View community-submitted research findings and results for {peptide.name}. See aggregated statistics and individual experiences."
	/>
</svelte:head>

<div class="results-page">
	<header class="page-header">
		<div class="breadcrumb">
			<a href="/peptides">Peptides</a>
			<span>/</span>
			<a href="/peptides/{peptide.id}">{peptide.name}</a>
			<span>/</span>
			<span>Results</span>
		</div>
		<h1>Community Results</h1>
		<p class="subtitle">
			Anonymized research findings submitted by community members for {peptide.name}
		</p>
	</header>

	{#if aggregateStats.totalSubmissions === 0}
		<div class="no-results">
			<FlaskConical class="h-16 w-16 text-muted-foreground" />
			<h2>No Results Yet</h2>
			<p>Be the first to share your experience with {peptide.name}.</p>
			<a href="/peptides/{peptide.id}/submit-findings" class="btn-primary"> Submit Your Findings </a>
		</div>
	{:else}
		<!-- Aggregate Statistics -->
		<!-- Data Quality Notice -->
		{#if aggregateStats.totalSubmissions < 5}
			<div class="data-notice warning">
				<AlertTriangle class="h-5 w-5" />
				<span>Limited data: Only {aggregateStats.totalSubmissions} submission{aggregateStats.totalSubmissions !== 1 ? 's' : ''} available. Results should be interpreted with caution.</span>
			</div>
		{/if}

		<section class="stats-section">
			<h2 class="section-title">
				<BarChart3 class="h-5 w-5" />
				Aggregate Statistics
			</h2>

			<!-- Primary Stats Row -->
			<div class="stats-grid">
				<div class="stat-card">
					<div class="stat-icon">
						<Users class="h-6 w-6" />
					</div>
					<div class="stat-content">
						<span class="stat-value">{aggregateStats.totalSubmissions}</span>
						<span class="stat-label">Total Submissions</span>
					</div>
				</div>

				<div class="stat-card">
					<div class="stat-icon highlight">
						<Star class="h-6 w-6" />
					</div>
					<div class="stat-content">
						<span class="stat-value">{aggregateStats.avgEffectiveness}/10</span>
						<span class="stat-label">Avg. Effectiveness</span>
					</div>
				</div>

				{#if hasNpsData}
					<div class="stat-card">
						<div class="stat-icon {getNpsColorClass(aggregateStats.npsScore)}">
							<Target class="h-6 w-6" />
						</div>
						<div class="stat-content">
							<span class="stat-value">{aggregateStats.npsScore > 0 ? '+' : ''}{aggregateStats.npsScore}</span>
							<span class="stat-label">NPS Score</span>
						</div>
					</div>
				{/if}

				<div class="stat-card">
					<div class="stat-icon">
						<Clock class="h-6 w-6" />
					</div>
					<div class="stat-content">
						<span class="stat-value">{aggregateStats.avgTimeToNotice} days</span>
						<span class="stat-label">Time to Notice</span>
					</div>
				</div>

				{#if aggregateStats.avgTimeToPeak > 0}
					<div class="stat-card">
						<div class="stat-icon">
							<TrendingUp class="h-6 w-6" />
						</div>
						<div class="stat-content">
							<span class="stat-value">{aggregateStats.avgTimeToPeak} days</span>
							<span class="stat-label">Time to Peak</span>
						</div>
					</div>
				{/if}

				<div class="stat-card">
					<div class="stat-icon success">
						<ThumbsUp class="h-6 w-6" />
					</div>
					<div class="stat-content">
						<span class="stat-value">{aggregateStats.wouldUseAgainPercentage}%</span>
						<span class="stat-label">Would Use Again</span>
					</div>
				</div>

				<div class="stat-card">
					<div class="stat-icon">
						<Calendar class="h-6 w-6" />
					</div>
					<div class="stat-content">
						<span class="stat-value">{aggregateStats.avgCycleLength} weeks</span>
						<span class="stat-label">Avg. Cycle Length</span>
					</div>
				</div>

				{#if aggregateStats.highConfidencePercentage > 0}
					<div class="stat-card">
						<div class="stat-icon">
							<Shield class="h-6 w-6" />
						</div>
						<div class="stat-content">
							<span class="stat-value">{aggregateStats.highConfidencePercentage}%</span>
							<span class="stat-label">High Confidence</span>
						</div>
					</div>
				{/if}

				{#if aggregateStats.repeatUserPercentage > 0}
					<div class="stat-card">
						<div class="stat-icon">
							<Repeat class="h-6 w-6" />
						</div>
						<div class="stat-content">
							<span class="stat-value">{aggregateStats.repeatUserPercentage}%</span>
							<span class="stat-label">Repeat Users</span>
						</div>
					</div>
				{/if}
			</div>

			<!-- Effectiveness Distribution -->
			<div class="distribution-chart">
				<h3>Effectiveness Distribution</h3>
				<div class="chart-bars">
					{#each aggregateStats.effectivenessDistribution as item}
						<div class="chart-bar-group">
							<div class="chart-bar-container">
								<div
									class="chart-bar"
									style="height: {getBarWidth(item.count, maxEffectivenessCount)}"
								></div>
							</div>
							<span class="chart-label">{item.rating}</span>
						</div>
					{/each}
				</div>
				<p class="chart-caption">Distribution of effectiveness ratings (1-10)</p>
			</div>

			<!-- Administration Methods -->
			{#if Object.keys(aggregateStats.administrationMethods).length > 0}
				<div class="admin-methods">
					<h3>Administration Methods</h3>
					<div class="method-tags">
						{#each Object.entries(aggregateStats.administrationMethods) as [method, count]}
							<span class="method-tag">
								<Syringe class="h-4 w-4" />
								{getAdminMethodLabel(method)}
								<span class="method-count">{count}</span>
							</span>
						{/each}
					</div>
				</div>
			{/if}

			<!-- NPS Distribution -->
			{#if hasNpsData}
				<div class="distribution-chart nps-chart">
					<h3>Recommendation Score Distribution (NPS)</h3>
					<div class="nps-summary">
						<span class="nps-score-large {getNpsColorClass(aggregateStats.npsScore)}">
							{aggregateStats.npsScore > 0 ? '+' : ''}{aggregateStats.npsScore}
						</span>
						<div class="nps-breakdown">
							<span class="nps-segment promoters">
								<span class="segment-count">{aggregateStats.npsBreakdown.promoters}</span>
								Promoters (9-10)
							</span>
							<span class="nps-segment passives">
								<span class="segment-count">{aggregateStats.npsBreakdown.passives}</span>
								Passives (7-8)
							</span>
							<span class="nps-segment detractors">
								<span class="segment-count">{aggregateStats.npsBreakdown.detractors}</span>
								Detractors (0-6)
							</span>
						</div>
					</div>
					<div class="chart-bars nps-bars">
						{#each aggregateStats.npsDistribution as item}
							<div class="chart-bar-group">
								<div class="chart-bar-container">
									<div
										class="chart-bar {getNpsBarClass(item.score)}"
										style="height: {getBarWidth(item.count, maxNpsCount)}"
									></div>
								</div>
								<span class="chart-label">{item.score}</span>
							</div>
						{/each}
					</div>
					<p class="chart-caption">How likely would users recommend this peptide? (0-10)</p>
				</div>
			{/if}

			<!-- Effect Persistence -->
			{#if hasEffectPersistence}
				<div class="distribution-section">
					<h3>Effect Persistence After Stopping</h3>
					<div class="horizontal-bars">
						{#each Object.entries(aggregateStats.effectPersistenceDistribution) as [persistence, count]}
							{@const total = Object.values(aggregateStats.effectPersistenceDistribution).reduce((a, b) => a + b, 0)}
							{@const percentage = Math.round((count / total) * 100)}
							<div class="horizontal-bar-item">
								<span class="bar-label">{getEffectPersistenceLabel(persistence)}</span>
								<div class="bar-container">
									<div class="bar-fill" style="width: {percentage}%"></div>
								</div>
								<span class="bar-value">{count} ({percentage}%)</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</section>

		<!-- Concurrent Compounds Section -->
		{#if hasConcurrentCompounds}
			<section class="data-section">
				<h2 class="section-title">
					<Pill class="h-5 w-5" />
					Commonly Stacked Compounds
				</h2>
				<p class="section-description">Compounds most frequently used alongside {peptide.name}</p>
				<div class="compound-list">
					{#each aggregateStats.topConcurrentCompounds as compound}
						<div class="compound-item">
							<span class="compound-name">{compound.name}</span>
							<span class="compound-count">{compound.count} user{compound.count !== 1 ? 's' : ''}</span>
						</div>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Custom Effects Section -->
		{#if hasCustomEffects}
			<section class="data-section">
				<h2 class="section-title">
					<Sparkles class="h-5 w-5" />
					Reported Effects
				</h2>
				<p class="section-description">Custom effects reported by users</p>
				<div class="effects-grid">
					{#each aggregateStats.topCustomEffects as effect}
						<div class="effect-card">
							<span class="effect-name">{effect.name}</span>
							<div class="effect-stats">
								<span class="effect-rating">{effect.avgRating}/10 avg</span>
								<span class="effect-count">{effect.count} report{effect.count !== 1 ? 's' : ''}</span>
							</div>
						</div>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Lifestyle Factors Panel -->
		{#if hasLifestyleData}
			<section class="data-section collapsible">
				<button class="section-header-btn" onclick={() => showLifestylePanel = !showLifestylePanel}>
					<h2 class="section-title">
						<Activity class="h-5 w-5" />
						Lifestyle Context
					</h2>
					<span class="toggle-icon">
						{#if showLifestylePanel}
							<ChevronUp class="h-5 w-5" />
						{:else}
							<ChevronDown class="h-5 w-5" />
						{/if}
					</span>
				</button>
				{#if showLifestylePanel}
					<div class="lifestyle-grid">
						{#if Object.keys(aggregateStats.lifestyleStats.training).length > 0}
							<div class="lifestyle-category">
								<h4><Dumbbell class="h-4 w-4" /> Training Intensity</h4>
								<div class="lifestyle-bars">
									{#each Object.entries(aggregateStats.lifestyleStats.training) as [level, count]}
										{@const total = Object.values(aggregateStats.lifestyleStats.training).reduce((a, b) => a + b, 0)}
										{@const pct = Math.round((count / total) * 100)}
										<div class="mini-bar">
											<span class="mini-label">{level}</span>
											<div class="mini-bar-bg">
												<div class="mini-bar-fill" style="width: {pct}%"></div>
											</div>
											<span class="mini-value">{pct}%</span>
										</div>
									{/each}
								</div>
							</div>
						{/if}
						{#if Object.keys(aggregateStats.lifestyleStats.sleep).length > 0}
							<div class="lifestyle-category">
								<h4><Moon class="h-4 w-4" /> Sleep Quality</h4>
								<div class="lifestyle-bars">
									{#each Object.entries(aggregateStats.lifestyleStats.sleep) as [level, count]}
										{@const total = Object.values(aggregateStats.lifestyleStats.sleep).reduce((a, b) => a + b, 0)}
										{@const pct = Math.round((count / total) * 100)}
										<div class="mini-bar">
											<span class="mini-label">{level}</span>
											<div class="mini-bar-bg">
												<div class="mini-bar-fill" style="width: {pct}%"></div>
											</div>
											<span class="mini-value">{pct}%</span>
										</div>
									{/each}
								</div>
							</div>
						{/if}
						{#if Object.keys(aggregateStats.lifestyleStats.stress).length > 0}
							<div class="lifestyle-category">
								<h4><Brain class="h-4 w-4" /> Stress Level</h4>
								<div class="lifestyle-bars">
									{#each Object.entries(aggregateStats.lifestyleStats.stress) as [level, count]}
										{@const total = Object.values(aggregateStats.lifestyleStats.stress).reduce((a, b) => a + b, 0)}
										{@const pct = Math.round((count / total) * 100)}
										<div class="mini-bar">
											<span class="mini-label">{level}</span>
											<div class="mini-bar-bg">
												<div class="mini-bar-fill" style="width: {pct}%"></div>
											</div>
											<span class="mini-value">{pct}%</span>
										</div>
									{/each}
								</div>
							</div>
						{/if}
						{#if Object.keys(aggregateStats.lifestyleStats.diet).length > 0}
							<div class="lifestyle-category">
								<h4><Utensils class="h-4 w-4" /> Diet Adherence</h4>
								<div class="lifestyle-bars">
									{#each Object.entries(aggregateStats.lifestyleStats.diet) as [level, count]}
										{@const total = Object.values(aggregateStats.lifestyleStats.diet).reduce((a, b) => a + b, 0)}
										{@const pct = Math.round((count / total) * 100)}
										<div class="mini-bar">
											<span class="mini-label">{level}</span>
											<div class="mini-bar-bg">
												<div class="mini-bar-fill" style="width: {pct}%"></div>
											</div>
											<span class="mini-value">{pct}%</span>
										</div>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				{/if}
			</section>
		{/if}

		<!-- Dosing Patterns Panel -->
		{#if hasDosingPatterns}
			<section class="data-section collapsible">
				<button class="section-header-btn" onclick={() => showDosingPatterns = !showDosingPatterns}>
					<h2 class="section-title">
						<Clock class="h-5 w-5" />
						Dosing Patterns
					</h2>
					<span class="toggle-icon">
						{#if showDosingPatterns}
							<ChevronUp class="h-5 w-5" />
						{:else}
							<ChevronDown class="h-5 w-5" />
						{/if}
					</span>
				</button>
				{#if showDosingPatterns}
					<div class="dosing-patterns-grid">
						{#if Object.keys(aggregateStats.dosingPatterns.timeOfDayDistribution).length > 0}
							<div class="pattern-category">
								<h4>Time of Day</h4>
								<div class="pattern-tags">
									{#each Object.entries(aggregateStats.dosingPatterns.timeOfDayDistribution) as [time, count]}
										<span class="pattern-tag">
											{getTimeOfDayLabel(time)}
											<span class="pattern-count">{count}</span>
										</span>
									{/each}
								</div>
							</div>
						{/if}
						{#if Object.keys(aggregateStats.dosingPatterns.mealTimingDistribution).length > 0}
							<div class="pattern-category">
								<h4>Meal Timing</h4>
								<div class="pattern-tags">
									{#each Object.entries(aggregateStats.dosingPatterns.mealTimingDistribution) as [timing, count]}
										<span class="pattern-tag">
											{getMealTimingLabel(timing)}
											<span class="pattern-count">{count}</span>
										</span>
									{/each}
								</div>
							</div>
						{/if}
						{#if aggregateStats.dosingPatterns.loadingDosePercentage > 0}
							<div class="pattern-category">
								<h4>Loading Doses</h4>
								<p class="pattern-stat">{aggregateStats.dosingPatterns.loadingDosePercentage}% of protocols include a loading dose</p>
							</div>
						{/if}
					</div>
				{/if}
			</section>
		{/if}

		<!-- Enhanced Side Effects Section -->
		{#if hasSideEffectsAnalysis}
			<section class="data-section">
				<h2 class="section-title">
					<AlertTriangle class="h-5 w-5" />
					Side Effects Analysis
				</h2>

				<div class="side-effects-analysis">
					<!-- Top Side Effects -->
					<div class="top-side-effects">
						<h3>Most Reported Side Effects</h3>
						<div class="side-effect-bars">
							{#each aggregateStats.sideEffectsAnalysis.topSideEffects as effect}
								<div class="side-effect-bar-item">
									<div class="side-effect-info">
										<span class="side-effect-name">{effect.name}</span>
										<span class="side-effect-severity severity-{Math.round(effect.avgSeverity)}">
											Avg severity: {effect.avgSeverity}/5
										</span>
									</div>
									<span class="side-effect-count">{effect.count}</span>
								</div>
							{/each}
						</div>
					</div>

					<!-- Onset & Resolution -->
					<div class="onset-resolution-grid">
						{#if Object.keys(aggregateStats.sideEffectsAnalysis.onsetDistribution).length > 0}
							<div class="onset-section">
								<h4>Onset Timing</h4>
								<div class="mini-distribution">
									{#each Object.entries(aggregateStats.sideEffectsAnalysis.onsetDistribution) as [timing, count]}
										<div class="mini-item">
											<span class="mini-label">{getOnsetTimingLabel(timing)}</span>
											<span class="mini-count">{count}</span>
										</div>
									{/each}
								</div>
							</div>
						{/if}
						{#if Object.keys(aggregateStats.sideEffectsAnalysis.resolutionDistribution).length > 0}
							<div class="resolution-section">
								<h4>Resolution Status</h4>
								<div class="mini-distribution">
									{#each Object.entries(aggregateStats.sideEffectsAnalysis.resolutionDistribution) as [status, count]}
										<div class="mini-item">
											<span class="mini-label">{getResolutionLabel(status)}</span>
											<span class="mini-count">{count}</span>
										</div>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				</div>
			</section>
		{/if}

		<!-- Why Stopped Section -->
		{#if Object.keys(aggregateStats.whyStoppedDistribution).length > 0}
			<section class="data-section compact">
				<h3 class="subsection-title">Why Users Stopped</h3>
				<div class="reason-tags">
					{#each Object.entries(aggregateStats.whyStoppedDistribution) as [reason, count]}
						<span class="reason-tag">
							{getWhyStoppedLabel(reason)}
							<span class="reason-count">{count}</span>
						</span>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Individual Submissions -->
		<section class="submissions-section">
			<h2 class="section-title">
				<FlaskConical class="h-5 w-5" />
				Individual Submissions
			</h2>

			<div class="submissions-list">
				{#each findings as finding}
					{@const findingId = finding.id || ''}
					{@const phases = findingId ? dosingPhases[findingId] || [] : []}
					{@const effects = findingId ? sideEffects[findingId] || [] : []}
					{@const result = findingId ? results[findingId] : undefined}
					{@const effectiveness = result?.effectiveness_rating ?? 0}
					<div class="submission-card" class:expanded={expandedFindings[findingId]}>
						<button class="submission-header" onclick={() => toggleFinding(findingId)}>
							<div class="submission-meta">
								<span class="submission-id">#{finding.anonymous_id?.slice(0, 8)}</span>
								<span class="submission-date">{formatDate(finding.created_at || '')}</span>
							</div>
							<div class="submission-summary">
								<span class="effectiveness-badge" class:high={effectiveness >= 7}>
									<TrendingUp class="h-4 w-4" />
									{effectiveness}/10
								</span>
								{#if finding.would_use_again === 'yes'}
									<span class="would-use-badge yes">
										<ThumbsUp class="h-4 w-4" />
										Would use again
									</span>
								{:else if finding.would_use_again === 'no'}
									<span class="would-use-badge no">Would not use again</span>
								{:else}
									<span class="would-use-badge maybe">Maybe</span>
								{/if}
							</div>
							<div class="expand-icon">
								{#if expandedFindings[findingId]}
									<ChevronUp class="h-5 w-5" />
								{:else}
									<ChevronDown class="h-5 w-5" />
								{/if}
							</div>
						</button>

						{#if expandedFindings[findingId]}
							{@const findingCompounds = findingId ? concurrentCompounds[findingId] || [] : []}
							{@const findingCustomResults = findingId ? customResults[findingId] || [] : []}
							<div class="submission-details">
								<!-- Dosing Info -->
								{#if phases.length > 0}
									<div class="detail-section">
										<h4>Dosing Protocol</h4>
										<div class="phases-list">
											{#each phases as phase, i}
												<div class="phase-item" class:break={phase.is_break}>
													<span class="phase-number">Phase {i + 1}</span>
													{#if phase.is_break}
														<span class="phase-desc">Break - {phase.duration_weeks} weeks</span>
													{:else}
														<span class="phase-desc">
															{phase.dose} {phase.dose_unit}
															{getFrequencyLabel(phase.frequency)} for {phase.duration_weeks} weeks
															{#if phase.time_of_day}
																<span class="phase-timing">({getTimeOfDayLabel(phase.time_of_day)}{#if phase.meal_timing}, {getMealTimingLabel(phase.meal_timing)}{/if})</span>
															{/if}
															{#if phase.is_loading_dose}
																<span class="loading-badge">Loading</span>
															{/if}
														</span>
													{/if}
												</div>
											{/each}
										</div>
									</div>
								{/if}

								<!-- Administration -->
								<div class="detail-section">
									<h4>Administration</h4>
									<div class="detail-grid">
										<div class="detail-item">
											<span class="detail-label">Method</span>
											<span class="detail-value"
												>{getAdminMethodLabel(finding.administration_method || 'subq')}</span
											>
										</div>
										{#if finding.reconstitution_solution}
											<div class="detail-item">
												<span class="detail-label">Diluent</span>
												<span class="detail-value"
													>{finding.reconstitution_solution.replace('_', ' ')}</span
												>
											</div>
										{/if}
										{#if finding.vial_size_mg}
											<div class="detail-item">
												<span class="detail-label">Vial Size</span>
												<span class="detail-value">{finding.vial_size_mg}mg</span>
											</div>
										{/if}
										{#if finding.diluent_volume_ml}
											<div class="detail-item">
												<span class="detail-label">Diluent Volume</span>
												<span class="detail-value">{finding.diluent_volume_ml}mL</span>
											</div>
										{/if}
										{#if finding.injection_site}
											<div class="detail-item">
												<span class="detail-label">Injection Site</span>
												<span class="detail-value">{getInjectionSiteLabel(finding.injection_site)}</span>
											</div>
										{/if}
										{#if finding.needle_gauge}
											<div class="detail-item">
												<span class="detail-label">Needle Gauge</span>
												<span class="detail-value">{finding.needle_gauge}</span>
											</div>
										{/if}
										{#if finding.storage_condition}
											<div class="detail-item">
												<span class="detail-label">Storage</span>
												<span class="detail-value">{finding.storage_condition === 'refrigerated' ? 'Refrigerated' : 'Room temp'}</span>
											</div>
										{/if}
									</div>
								</div>

								<!-- Source Info (if provided) -->
								{#if finding.source_type && finding.source_type !== 'prefer_not_say'}
									<div class="detail-section">
										<h4>Source Information</h4>
										<div class="detail-grid">
											<div class="detail-item">
												<span class="detail-label">Source Type</span>
												<span class="detail-value">{getSourceTypeLabel(finding.source_type)}</span>
											</div>
											{#if finding.source_verified && finding.source_verified !== 'prefer_not_say'}
												<div class="detail-item">
													<span class="detail-label">Verified</span>
													<span class="detail-value">{finding.source_verified === 'yes' ? 'Yes' : 'No'}</span>
												</div>
											{/if}
											{#if finding.same_batch}
												<div class="detail-item">
													<span class="detail-label">Same Batch</span>
													<span class="detail-value">{finding.same_batch === 'yes' ? 'Yes' : finding.same_batch === 'no' ? 'No' : 'Multiple batches'}</span>
												</div>
											{/if}
										</div>
									</div>
								{/if}

								<!-- Results -->
								<div class="detail-section">
									<h4>Results</h4>
									<div class="detail-grid">
										<div class="detail-item">
											<span class="detail-label">Effectiveness</span>
											<span class="detail-value">{effectiveness}/10</span>
										</div>
										{#if finding.recommend_score != null}
											<div class="detail-item">
												<span class="detail-label">Recommend Score</span>
												<span class="detail-value">{finding.recommend_score}/10</span>
											</div>
										{/if}
										{#if result?.time_to_notice_days}
											<div class="detail-item">
												<span class="detail-label">Time to Notice</span>
												<span class="detail-value">{result.time_to_notice_days} days</span>
											</div>
										{/if}
										{#if result?.time_to_peak_days}
											<div class="detail-item">
												<span class="detail-label">Time to Peak</span>
												<span class="detail-value">{result.time_to_peak_days} days</span>
											</div>
										{/if}
										{#if result?.effect_persistence}
											<div class="detail-item">
												<span class="detail-label">Effect Persistence</span>
												<span class="detail-value">{getEffectPersistenceLabel(result.effect_persistence)}</span>
											</div>
										{/if}
										<div class="detail-item">
											<span class="detail-label">Cycle Length</span>
											<span class="detail-value">{finding.cycle_length_weeks || 'N/A'} weeks</span>
										</div>
										{#if finding.why_stopped}
											<div class="detail-item">
												<span class="detail-label">Why Stopped</span>
												<span class="detail-value">{getWhyStoppedLabel(finding.why_stopped)}</span>
											</div>
										{/if}
									</div>
									{#if finding.dose_response_noticed}
										<div class="dose-response-note">
											<span class="detail-label">Dose Response Noted</span>
											{#if finding.dose_response_notes}
												<p class="notes-text">{finding.dose_response_notes}</p>
											{/if}
										</div>
									{/if}
									{#if finding.notes}
										<div class="notes-section">
											<span class="detail-label">Notes</span>
											<p class="notes-text">{finding.notes}</p>
										</div>
									{/if}
								</div>

								<!-- Lifestyle Context -->
								{#if finding.training_intensity || finding.sleep_quality || finding.stress_level || finding.diet_adherence}
									<div class="detail-section">
										<h4>Lifestyle Context</h4>
										<div class="lifestyle-tags">
											{#if finding.training_intensity}
												<span class="lifestyle-tag"><Dumbbell class="h-3 w-3" /> {finding.training_intensity}</span>
											{/if}
											{#if finding.sleep_quality}
												<span class="lifestyle-tag"><Moon class="h-3 w-3" /> {finding.sleep_quality} sleep</span>
											{/if}
											{#if finding.stress_level}
												<span class="lifestyle-tag"><Brain class="h-3 w-3" /> {finding.stress_level} stress</span>
											{/if}
											{#if finding.diet_adherence}
												<span class="lifestyle-tag"><Utensils class="h-3 w-3" /> {finding.diet_adherence} diet</span>
											{/if}
										</div>
									</div>
								{/if}

								<!-- Concurrent Compounds -->
								{#if findingCompounds.length > 0}
									<div class="detail-section">
										<h4>Concurrent Compounds</h4>
										<div class="compounds-list">
											{#each findingCompounds as compound}
												<div class="compound-item-detail">
													<span class="compound-name">{compound.compound_name}</span>
													{#if compound.dose}
														<span class="compound-dose">{compound.dose}</span>
													{/if}
												</div>
											{/each}
										</div>
									</div>
								{/if}

								<!-- Custom Results -->
								{#if findingCustomResults.length > 0}
									<div class="detail-section">
										<h4>Observed Effects</h4>
										<div class="custom-results-list">
											{#each findingCustomResults as customResult}
												<div class="custom-result-item">
													<span class="result-name">{customResult.effect_name}</span>
													<span class="result-rating">{customResult.rating}/10</span>
												</div>
											{/each}
										</div>
									</div>
								{/if}

								<!-- Category-specific results -->
								{#if result?.data}
									<div class="detail-section">
										<h4>Category Results ({result.category})</h4>
										<pre class="json-data">{JSON.stringify(result.data, null, 2)}</pre>
									</div>
								{/if}

								<!-- Side Effects -->
								{#if effects.length > 0}
									<div class="detail-section">
										<h4>
											<AlertTriangle class="h-4 w-4" />
											Side Effects Reported
										</h4>
										<div class="side-effects-list">
											{#each effects as effect}
												<div class="side-effect-item">
													<div class="effect-header">
														<span class="effect-name">{effect.side_effect_name}</span>
														{#if effect.severity}
															<span class="severity-indicator severity-{effect.severity}">
																Severity: {effect.severity}/5
															</span>
														{/if}
													</div>
													<div class="effect-meta">
														{#if effect.onset_timing}
															<span class="effect-timing">{getOnsetTimingLabel(effect.onset_timing)}</span>
														{/if}
														{#if effect.resolved}
															<span class="effect-resolved">{getResolutionLabel(effect.resolved)}</span>
														{/if}
													</div>
													{#if effect.management_strategy}
														<p class="effect-management">Management: {effect.management_strategy}</p>
													{/if}
													{#if effect.notes}
														<p class="effect-notes">{effect.notes}</p>
													{/if}
												</div>
											{/each}
										</div>
									</div>
								{/if}

								<!-- Data Quality -->
								{#if finding.data_confidence}
									<div class="detail-section data-quality">
										<div class="confidence-badge">
											<Shield class="h-4 w-4" />
											{getDataConfidenceLabel(finding.data_confidence)}
										</div>
									</div>
								{/if}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</section>
	{/if}

	<div class="cta-section">
		<p>Have experience with {peptide.name}?</p>
		<a href="/peptides/{peptide.id}/submit-findings" class="btn-primary"> Share Your Findings </a>
	</div>
</div>

<style>
	.results-page {
		max-width: 1000px;
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
		font-size: 2rem;
		font-weight: 600;
		color: var(--foreground);
		margin-bottom: 0.5rem;
	}

	.subtitle {
		color: var(--muted-foreground);
	}

	/* No Results State */
	.no-results {
		text-align: center;
		padding: 4rem 2rem;
		background: var(--muted);
		border-radius: 12px;
		border: 1px solid var(--border);
	}

	.no-results h2 {
		font-size: 1.5rem;
		margin: 1rem 0 0.5rem;
	}

	.no-results p {
		color: var(--muted-foreground);
		margin-bottom: 1.5rem;
	}

	/* Section Titles */
	.section-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 1.5rem;
		color: var(--foreground);
	}

	/* Stats Section */
	.stats-section {
		background: var(--muted);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 1.5rem;
		margin-bottom: 2rem;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.stat-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		background: var(--background);
		padding: 1rem;
		border-radius: 8px;
		border: 1px solid var(--border);
	}

	.stat-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: var(--muted);
		color: var(--muted-foreground);
	}

	.stat-icon.highlight {
		background: var(--accent);
		color: white;
	}

	.stat-icon.success {
		background: #22c55e;
		color: white;
	}

	.stat-content {
		display: flex;
		flex-direction: column;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--foreground);
	}

	.stat-label {
		font-size: 0.75rem;
		color: var(--muted-foreground);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	/* Distribution Chart */
	.distribution-chart {
		background: var(--background);
		padding: 1.5rem;
		border-radius: 8px;
		border: 1px solid var(--border);
		margin-bottom: 1.5rem;
	}

	.distribution-chart h3 {
		font-size: 1rem;
		font-weight: 600;
		margin-bottom: 1rem;
	}

	.chart-bars {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		height: 120px;
		gap: 0.5rem;
	}

	.chart-bar-group {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		height: 100%;
	}

	.chart-bar-container {
		flex: 1;
		width: 100%;
		display: flex;
		align-items: flex-end;
	}

	.chart-bar {
		width: 100%;
		background: var(--accent);
		border-radius: 4px 4px 0 0;
		min-height: 4px;
		transition: height 0.3s ease;
	}

	.chart-label {
		font-size: 0.75rem;
		color: var(--muted-foreground);
		margin-top: 0.5rem;
	}

	.chart-caption {
		text-align: center;
		font-size: 0.75rem;
		color: var(--muted-foreground);
		margin-top: 1rem;
	}

	/* Administration Methods */
	.admin-methods h3 {
		font-size: 1rem;
		font-weight: 600;
		margin-bottom: 1rem;
	}

	.method-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.method-tag {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: var(--background);
		border: 1px solid var(--border);
		border-radius: 20px;
		font-size: 0.875rem;
	}

	.method-count {
		background: var(--accent);
		color: white;
		padding: 0.125rem 0.5rem;
		border-radius: 10px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	/* Submissions Section */
	.submissions-section {
		margin-bottom: 2rem;
	}

	.submissions-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.submission-card {
		background: var(--muted);
		border: 1px solid var(--border);
		border-radius: 12px;
		overflow: hidden;
	}

	.submission-header {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.5rem;
		background: transparent;
		border: none;
		cursor: pointer;
		text-align: left;
		transition: background 0.2s;
	}

	.submission-header:hover {
		background: var(--background);
	}

	.submission-meta {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.submission-id {
		font-family: monospace;
		font-size: 0.875rem;
		color: var(--muted-foreground);
	}

	.submission-date {
		font-size: 0.75rem;
		color: var(--muted-foreground);
	}

	.submission-summary {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.effectiveness-badge {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		background: var(--border);
		border-radius: 20px;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.effectiveness-badge.high {
		background: var(--accent);
		color: white;
	}

	.would-use-badge {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		border-radius: 20px;
		font-size: 0.75rem;
	}

	.would-use-badge.yes {
		background: #22c55e20;
		color: #22c55e;
	}

	.would-use-badge.no {
		background: #ef444420;
		color: #ef4444;
	}

	.would-use-badge.maybe {
		background: var(--border);
		color: var(--muted-foreground);
	}

	.expand-icon {
		color: var(--muted-foreground);
	}

	/* Submission Details */
	.submission-details {
		padding: 0 1.5rem 1.5rem;
		border-top: 1px solid var(--border);
	}

	.detail-section {
		padding: 1rem 0;
		border-bottom: 1px solid var(--border);
	}

	.detail-section:last-child {
		border-bottom: none;
	}

	.detail-section h4 {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--foreground);
		margin-bottom: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.detail-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 1rem;
	}

	.detail-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.detail-label {
		font-size: 0.75rem;
		color: var(--muted-foreground);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.detail-value {
		font-weight: 500;
		color: var(--foreground);
	}

	/* Phases List */
	.phases-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.phase-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem;
		background: var(--background);
		border-radius: 6px;
	}

	.phase-item.break {
		opacity: 0.7;
		font-style: italic;
	}

	.phase-number {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--accent);
		text-transform: uppercase;
	}

	.phase-desc {
		color: var(--foreground);
	}

	/* Notes */
	.notes-section {
		margin-top: 1rem;
	}

	.notes-text {
		margin-top: 0.5rem;
		padding: 1rem;
		background: var(--background);
		border-radius: 6px;
		font-size: 0.875rem;
		line-height: 1.6;
		white-space: pre-wrap;
	}

	/* JSON Data */
	.json-data {
		margin-top: 0.5rem;
		padding: 1rem;
		background: var(--background);
		border-radius: 6px;
		font-size: 0.75rem;
		overflow-x: auto;
	}

	/* Side Effects */
	.side-effects-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.side-effect-item {
		padding: 0.75rem;
		background: var(--background);
		border-radius: 6px;
		border-left: 3px solid var(--border);
	}

	.effect-name {
		font-weight: 500;
	}

	.severity-indicator {
		margin-left: 0.5rem;
		padding: 0.125rem 0.5rem;
		border-radius: 10px;
		font-size: 0.75rem;
	}

	.severity-indicator.severity-1 {
		background: #22c55e20;
		color: #22c55e;
	}

	.severity-indicator.severity-2 {
		background: #84cc1620;
		color: #84cc16;
	}

	.severity-indicator.severity-3 {
		background: #eab30820;
		color: #eab308;
	}

	.severity-indicator.severity-4 {
		background: #f9731620;
		color: #f97316;
	}

	.severity-indicator.severity-5 {
		background: #ef444420;
		color: #ef4444;
	}

	.effect-notes {
		margin-top: 0.5rem;
		font-size: 0.875rem;
		color: var(--muted-foreground);
	}

	/* CTA Section */
	.cta-section {
		text-align: center;
		padding: 2rem;
		background: var(--muted);
		border: 1px solid var(--border);
		border-radius: 12px;
	}

	.cta-section p {
		color: var(--muted-foreground);
		margin-bottom: 1rem;
	}

	.btn-primary {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: var(--accent);
		color: white;
		border: none;
		border-radius: 8px;
		font-weight: 500;
		text-decoration: none;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-primary:hover {
		opacity: 0.9;
		transform: translateY(-1px);
	}

	/* Data Notice */
	.data-notice {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
		font-size: 0.875rem;
	}

	.data-notice.warning {
		background: #f59e0b15;
		border: 1px solid #f59e0b40;
		color: #b45309;
	}

	:global(.dark) .data-notice.warning {
		color: #fbbf24;
	}

	/* NPS Colors */
	.stat-icon.nps-excellent {
		background: #22c55e;
		color: white;
	}

	.stat-icon.nps-good {
		background: #eab308;
		color: white;
	}

	.stat-icon.nps-poor {
		background: #ef4444;
		color: white;
	}

	/* NPS Chart */
	.nps-chart {
		margin-top: 1.5rem;
	}

	.nps-summary {
		display: flex;
		align-items: center;
		gap: 2rem;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
	}

	.nps-score-large {
		font-size: 2.5rem;
		font-weight: 700;
		padding: 0.5rem 1rem;
		border-radius: 8px;
	}

	.nps-score-large.nps-excellent {
		background: #22c55e20;
		color: #22c55e;
	}

	.nps-score-large.nps-good {
		background: #eab30820;
		color: #eab308;
	}

	.nps-score-large.nps-poor {
		background: #ef444420;
		color: #ef4444;
	}

	.nps-breakdown {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		font-size: 0.875rem;
	}

	.nps-segment {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.segment-count {
		font-weight: 600;
		min-width: 1.5rem;
	}

	.nps-segment.promoters {
		color: #22c55e;
	}

	.nps-segment.passives {
		color: #eab308;
	}

	.nps-segment.detractors {
		color: #ef4444;
	}

	.chart-bar.nps-promoter {
		background: #22c55e;
	}

	.chart-bar.nps-passive {
		background: #eab308;
	}

	.chart-bar.nps-detractor {
		background: #ef4444;
	}

	/* Horizontal Bars */
	.distribution-section {
		background: var(--background);
		padding: 1.5rem;
		border-radius: 8px;
		border: 1px solid var(--border);
		margin-top: 1.5rem;
	}

	.distribution-section h3 {
		font-size: 1rem;
		font-weight: 600;
		margin-bottom: 1rem;
	}

	.horizontal-bars {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.horizontal-bar-item {
		display: grid;
		grid-template-columns: 120px 1fr 80px;
		align-items: center;
		gap: 1rem;
	}

	.bar-label {
		font-size: 0.875rem;
		color: var(--foreground);
	}

	.bar-container {
		height: 24px;
		background: var(--muted);
		border-radius: 4px;
		overflow: hidden;
	}

	.bar-fill {
		height: 100%;
		background: var(--accent);
		border-radius: 4px;
		transition: width 0.3s ease;
	}

	.bar-value {
		font-size: 0.75rem;
		color: var(--muted-foreground);
		text-align: right;
	}

	/* Data Sections */
	.data-section {
		background: var(--muted);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.data-section.compact {
		padding: 1rem 1.5rem;
	}

	.data-section.collapsible {
		padding: 0;
	}

	.section-header-btn {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.25rem 1.5rem;
		background: transparent;
		border: none;
		cursor: pointer;
		text-align: left;
	}

	.section-header-btn:hover {
		background: var(--background);
	}

	.section-header-btn .section-title {
		margin: 0;
	}

	.toggle-icon {
		color: var(--muted-foreground);
	}

	.section-description {
		color: var(--muted-foreground);
		font-size: 0.875rem;
		margin-bottom: 1rem;
	}

	.subsection-title {
		font-size: 1rem;
		font-weight: 600;
		margin-bottom: 1rem;
	}

	/* Compound List */
	.compound-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.compound-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		background: var(--background);
		border-radius: 8px;
		border: 1px solid var(--border);
	}

	.compound-name {
		font-weight: 500;
		text-transform: capitalize;
	}

	.compound-count {
		font-size: 0.875rem;
		color: var(--muted-foreground);
	}

	/* Effects Grid */
	.effects-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1rem;
	}

	.effect-card {
		padding: 1rem;
		background: var(--background);
		border-radius: 8px;
		border: 1px solid var(--border);
	}

	.effect-card .effect-name {
		display: block;
		font-weight: 500;
		text-transform: capitalize;
		margin-bottom: 0.5rem;
	}

	.effect-stats {
		display: flex;
		gap: 1rem;
		font-size: 0.75rem;
		color: var(--muted-foreground);
	}

	.effect-rating {
		color: var(--accent);
		font-weight: 500;
	}

	/* Lifestyle Grid */
	.lifestyle-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.5rem;
		padding: 0 1.5rem 1.5rem;
	}

	.lifestyle-category h4 {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		margin-bottom: 0.75rem;
		text-transform: capitalize;
	}

	.lifestyle-bars {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.mini-bar {
		display: grid;
		grid-template-columns: 70px 1fr 40px;
		align-items: center;
		gap: 0.5rem;
	}

	.mini-label {
		font-size: 0.75rem;
		text-transform: capitalize;
	}

	.mini-bar-bg {
		height: 8px;
		background: var(--border);
		border-radius: 4px;
		overflow: hidden;
	}

	.mini-bar-fill {
		height: 100%;
		background: var(--accent);
		border-radius: 4px;
	}

	.mini-value {
		font-size: 0.75rem;
		color: var(--muted-foreground);
		text-align: right;
	}

	/* Dosing Patterns */
	.dosing-patterns-grid {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: 0 1.5rem 1.5rem;
	}

	.pattern-category h4 {
		font-size: 0.875rem;
		font-weight: 600;
		margin-bottom: 0.75rem;
	}

	.pattern-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.pattern-tag {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: var(--background);
		border: 1px solid var(--border);
		border-radius: 20px;
		font-size: 0.875rem;
	}

	.pattern-count {
		background: var(--accent);
		color: white;
		padding: 0.125rem 0.5rem;
		border-radius: 10px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.pattern-stat {
		font-size: 0.875rem;
		color: var(--muted-foreground);
	}

	/* Side Effects Analysis */
	.side-effects-analysis {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.top-side-effects h3 {
		font-size: 1rem;
		font-weight: 600;
		margin-bottom: 1rem;
	}

	.side-effect-bars {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.side-effect-bar-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		background: var(--background);
		border-radius: 8px;
		border-left: 3px solid var(--border);
	}

	.side-effect-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.side-effect-name {
		font-weight: 500;
	}

	.side-effect-severity {
		font-size: 0.75rem;
	}

	.side-effect-count {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--muted-foreground);
	}

	.onset-resolution-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.5rem;
	}

	.onset-section h4,
	.resolution-section h4 {
		font-size: 0.875rem;
		font-weight: 600;
		margin-bottom: 0.75rem;
	}

	.mini-distribution {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.mini-item {
		display: flex;
		justify-content: space-between;
		padding: 0.5rem 0.75rem;
		background: var(--background);
		border-radius: 4px;
		font-size: 0.875rem;
	}

	.mini-count {
		font-weight: 600;
	}

	/* Reason Tags */
	.reason-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.reason-tag {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: var(--background);
		border: 1px solid var(--border);
		border-radius: 20px;
		font-size: 0.875rem;
	}

	.reason-count {
		background: var(--muted);
		padding: 0.125rem 0.5rem;
		border-radius: 10px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	/* Enhanced Submission Details */
	.phase-timing {
		color: var(--muted-foreground);
		font-size: 0.875rem;
	}

	.loading-badge {
		display: inline-block;
		padding: 0.125rem 0.5rem;
		background: var(--accent);
		color: white;
		border-radius: 4px;
		font-size: 0.675rem;
		font-weight: 600;
		text-transform: uppercase;
		margin-left: 0.5rem;
	}

	.dose-response-note {
		margin-top: 1rem;
		padding: 0.75rem;
		background: var(--background);
		border-radius: 6px;
		border-left: 3px solid var(--accent);
	}

	.lifestyle-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.lifestyle-tag {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		background: var(--background);
		border-radius: 20px;
		font-size: 0.75rem;
		text-transform: capitalize;
	}

	.compounds-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.compound-item-detail {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: var(--background);
		border-radius: 6px;
		font-size: 0.875rem;
	}

	.compound-dose {
		color: var(--muted-foreground);
	}

	.custom-results-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.custom-result-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 0.75rem;
		background: var(--background);
		border-radius: 6px;
	}

	.result-name {
		text-transform: capitalize;
	}

	.result-rating {
		font-weight: 600;
		color: var(--accent);
	}

	.effect-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.effect-meta {
		display: flex;
		gap: 0.75rem;
		margin-top: 0.25rem;
		font-size: 0.75rem;
	}

	.effect-timing,
	.effect-resolved {
		color: var(--muted-foreground);
	}

	.effect-management {
		margin-top: 0.5rem;
		font-size: 0.875rem;
		color: var(--muted-foreground);
		font-style: italic;
	}

	.detail-section.data-quality {
		display: flex;
		justify-content: flex-end;
		border-bottom: none;
		padding-top: 0.5rem;
	}

	.confidence-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		background: var(--background);
		border: 1px solid var(--border);
		border-radius: 20px;
		font-size: 0.75rem;
		color: var(--muted-foreground);
	}

	/* Responsive */
	@media (max-width: 640px) {
		.stats-grid {
			grid-template-columns: 1fr;
		}

		.submission-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.75rem;
		}

		.submission-summary {
			flex-wrap: wrap;
		}

		.expand-icon {
			position: absolute;
			right: 1rem;
			top: 1rem;
		}

		.submission-card {
			position: relative;
		}

		.horizontal-bar-item {
			grid-template-columns: 100px 1fr 60px;
		}

		.nps-summary {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.lifestyle-grid {
			grid-template-columns: 1fr;
		}

		.onset-resolution-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
