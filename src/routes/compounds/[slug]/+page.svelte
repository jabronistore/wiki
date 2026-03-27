<script lang="ts">
	import type { Peptide, PeptideSummary } from '$lib/types';
	import ItemDetail from '$lib/components/ItemDetail.svelte';

	let { data }: { data: { peptide: Peptide; allPeptides: PeptideSummary[] } } = $props();
</script>

<ItemDetail
	peptide={data.peptide}
	allPeptides={data.allPeptides}
	urlPrefix="/compounds"
	browseLabel="Compounds"
/>
