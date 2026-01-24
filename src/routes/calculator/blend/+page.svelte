<script lang="ts">
	import { BlendCalculator } from '$lib/components/calculator';
	import { currentBlend } from '$lib/stores/calculator';
	import SEO from 'sk-seo';

	// Get initial data from load function (for SSR)
	let { data } = $props();

	// Use store for reactive updates, fallback to SSR data
	const blendName = $derived($currentBlend.name || data.blendName);
	const blendId = $derived($currentBlend.id || data.initialBlendId);

	// Dynamic SEO based on blend
	const title = $derived(
		blendName
			? `${blendName} Blend Calculator | Peptide Database`
			: 'Blend Calculator | Peptide Database'
	);

	const description = $derived(
		blendName && blendName !== 'Custom'
			? `Calculate doses for ${blendName} peptide blend. Get precise dosing for each component in your blend.`
			: 'Calculate doses for peptide blends. Enter your blend composition and get precise dosing for each component.'
	);

	const keywords = $derived(
		blendName
			? `${blendName} blend calculator, ${blendName} peptide dosing, peptide blend calculator`
			: 'peptide blend calculator, peptide blend dosing, multi-peptide blend'
	);

	const canonical = $derived(
		blendId && blendId !== 'klow'
			? `https://peptide-db.com/calculator/blend?b=${blendId}`
			: 'https://peptide-db.com/calculator/blend'
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

<BlendCalculator />
