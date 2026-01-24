<script lang="ts">
	import { AccumulationPlotter } from '$lib/components/calculator';
	import { currentCalculatorPeptide } from '$lib/stores/calculator';
	import SEO from 'sk-seo';

	// Get initial data from load function (for SSR)
	let { data } = $props();

	// Use store for reactive updates, fallback to SSR data
	const peptideName = $derived($currentCalculatorPeptide.name || data.peptideName);
	const peptideId = $derived($currentCalculatorPeptide.id || data.initialPeptideId);

	// Dynamic SEO based on peptide
	const title = $derived(
		peptideName
			? `${peptideName} Accumulation Calculator | Peptide Database`
			: 'Accumulation Plotter | Peptide Database'
	);

	const description = $derived(
		peptideName
			? `Calculate ${peptideName} accumulation over time. Visualize concentration curves based on dose, frequency, and half-life.`
			: 'Visualize peptide accumulation in your body over time. Model concentration curves based on dose, frequency, and duration.'
	);

	const keywords = $derived(
		peptideName
			? `${peptideName} accumulation, ${peptideName} half-life, ${peptideName} dosing calculator, peptide concentration`
			: 'peptide accumulation, half-life calculator, peptide concentration, pharmacokinetics'
	);

	const canonical = $derived(
		peptideId
			? `https://peptide-db.com/calculator/accumulation?peptide=${peptideId}`
			: 'https://peptide-db.com/calculator/accumulation'
	);
</script>

<SEO
	{title}
	{description}
	{keywords}
	siteName="Peptide Database"
	{canonical}
	twitter={true}
	openGraph={true}
/>

<AccumulationPlotter initialPeptideId={data.initialPeptideId} />
