<script lang="ts">
	import { tick } from 'svelte';
	// @ts-ignore - no types available for smiles-drawer
	import SmilesDrawer from 'smiles-drawer';

	interface Props {
		sequence: string;
		showLegend?: boolean;
	}

	let { sequence, showLegend = true }: Props = $props();

	// Container for the structure SVGs
	let structureContainer: HTMLDivElement | undefined = $state(undefined);

	// Check if sequence is visualizable (contains standard 3-letter amino acid codes separated by dashes)
	const isVisualizableSequence = $derived.by(() => {
		if (!sequence) return false;
		// Skip non-sequences
		const skipPatterns = ['N/A', 'mixture', 'amino acid peptide', 'Not available', 'Complex'];
		if (skipPatterns.some((p) => sequence.toLowerCase().includes(p.toLowerCase()))) return false;
		// Check if it has the standard format (3-letter codes separated by dashes)
		const parts = sequence.split('-');
		if (parts.length < 2) return false;
		// At least half should be recognizable amino acids
		const recognizedCount = parts.filter((p) => {
			const cleaned = p.replace(/^(Ac|pGlu|D\(|L\(|\(|\)|NH2|[0-9])*/g, '').trim();
			return cleaned.length >= 2 && cleaned.length <= 4;
		}).length;
		return recognizedCount >= parts.length * 0.5;
	});

	// Three-letter to one-letter code mapping
	const threeToOne: Record<string, string> = {
		Ala: 'A',
		Arg: 'R',
		Asn: 'N',
		Asp: 'D',
		Cys: 'C',
		Gln: 'Q',
		Glu: 'E',
		Gly: 'G',
		His: 'H',
		Ile: 'I',
		Leu: 'L',
		Lys: 'K',
		Met: 'M',
		Phe: 'F',
		Pro: 'P',
		Ser: 'S',
		Thr: 'T',
		Trp: 'W',
		Tyr: 'Y',
		Val: 'V',
		Aib: 'U',
		Orn: 'O',
		Dab: 'X',
		Dap: 'X'
	};

	// SMILES strings for amino acid SIDE CHAINS only (R-groups)
	// These represent what hangs off the alpha carbon, not the full amino acid
	const sideChainSmiles: Record<string, string | null> = {
		// No side chain (hydrogen only)
		Gly: null,
		// Simple aliphatic
		Ala: 'C', // methyl -CH3
		Val: 'CC(C)C', // isopropyl -CH(CH3)2
		Leu: 'CCC(C)C', // isobutyl -CH2-CH(CH3)2
		Ile: 'CC(C)CC', // sec-butyl -CH(CH3)-CH2-CH3
		// Aromatic - benzene/indole rings
		Phe: 'CCc1ccccc1', // benzyl -CH2-phenyl
		Tyr: 'CCc1ccc(O)cc1', // tyrosyl -CH2-phenol
		Trp: 'CCc1c[nH]c2ccccc12', // indolylmethyl -CH2-indole
		// Sulfur-containing
		Met: 'CCSCC', // -CH2-CH2-S-CH3
		Cys: 'CCS', // -CH2-SH
		// Hydroxyl
		Ser: 'CCO', // -CH2-OH
		Thr: 'CC(C)O', // -CH(OH)-CH3
		// Basic (charged at physiological pH)
		Lys: 'CCCCCN', // -CH2-CH2-CH2-CH2-NH2
		Arg: 'CCCCNC(=N)N', // -CH2-CH2-CH2-NH-C(=NH)-NH2
		His: 'CCc1cnc[nH]1', // -CH2-imidazole
		// Acidic
		Asp: 'CCC(=O)O', // -CH2-COOH
		Glu: 'CCCC(=O)O', // -CH2-CH2-COOH
		// Amide
		Asn: 'CCC(=O)N', // -CH2-CONH2
		Gln: 'CCCC(=O)N', // -CH2-CH2-CONH2
		// Cyclic - proline is special (forms ring with backbone)
		Pro: 'C1CCNC1', // pyrrolidine ring (5-membered)
		// Modified
		Aib: 'CC(C)C' // -C(CH3)2 (alpha-aminoisobutyric acid has 2 methyls)
	};

	// Get one-letter sequence
	const oneLetterSequence = $derived(
		sequence
			? sequence
					.split('-')
					.map((aa) => threeToOne[aa.trim()] || '?')
					.join('')
			: ''
	);

	// Amino acid properties for coloring - using brand-derived warm palette
	// Hydrophobic: Slate tones, Polar: Success/muted green, Positive: Accent/Book Cloth, Negative: Warning/Kraft, Modified: Muted
	const aminoAcidProperties: Record<
		string,
		{
			color: string;
			bgColor: string;
			strokeColor: string;
			category: string;
			fullName: string;
			oneLetter: string;
		}
	> = {
		// Hydrophobic (Slate/Primary tones)
		Ala: {
			color: 'text-foreground',
			bgColor: 'bg-muted',
			strokeColor: '#40403E',
			category: 'hydrophobic',
			fullName: 'Alanine',
			oneLetter: 'A'
		},
		Val: {
			color: 'text-foreground',
			bgColor: 'bg-muted',
			strokeColor: '#40403E',
			category: 'hydrophobic',
			fullName: 'Valine',
			oneLetter: 'V'
		},
		Leu: {
			color: 'text-foreground',
			bgColor: 'bg-muted',
			strokeColor: '#40403E',
			category: 'hydrophobic',
			fullName: 'Leucine',
			oneLetter: 'L'
		},
		Ile: {
			color: 'text-foreground',
			bgColor: 'bg-muted',
			strokeColor: '#40403E',
			category: 'hydrophobic',
			fullName: 'Isoleucine',
			oneLetter: 'I'
		},
		Met: {
			color: 'text-foreground',
			bgColor: 'bg-muted',
			strokeColor: '#40403E',
			category: 'hydrophobic',
			fullName: 'Methionine',
			oneLetter: 'M'
		},
		Phe: {
			color: 'text-foreground',
			bgColor: 'bg-muted',
			strokeColor: '#40403E',
			category: 'hydrophobic',
			fullName: 'Phenylalanine',
			oneLetter: 'F'
		},
		Trp: {
			color: 'text-foreground',
			bgColor: 'bg-muted',
			strokeColor: '#40403E',
			category: 'hydrophobic',
			fullName: 'Tryptophan',
			oneLetter: 'W'
		},
		Pro: {
			color: 'text-foreground',
			bgColor: 'bg-muted',
			strokeColor: '#40403E',
			category: 'hydrophobic',
			fullName: 'Proline',
			oneLetter: 'P'
		},

		// Polar uncharged (Success/green tones)
		Gly: {
			color: 'text-success',
			bgColor: 'bg-success/10',
			strokeColor: 'hsl(158 45% 40%)',
			category: 'polar',
			fullName: 'Glycine',
			oneLetter: 'G'
		},
		Ser: {
			color: 'text-success',
			bgColor: 'bg-success/10',
			strokeColor: 'hsl(158 45% 40%)',
			category: 'polar',
			fullName: 'Serine',
			oneLetter: 'S'
		},
		Thr: {
			color: 'text-success',
			bgColor: 'bg-success/10',
			strokeColor: 'hsl(158 45% 40%)',
			category: 'polar',
			fullName: 'Threonine',
			oneLetter: 'T'
		},
		Cys: {
			color: 'text-success',
			bgColor: 'bg-success/10',
			strokeColor: 'hsl(158 45% 40%)',
			category: 'polar',
			fullName: 'Cysteine',
			oneLetter: 'C'
		},
		Tyr: {
			color: 'text-success',
			bgColor: 'bg-success/10',
			strokeColor: 'hsl(158 45% 40%)',
			category: 'polar',
			fullName: 'Tyrosine',
			oneLetter: 'Y'
		},
		Asn: {
			color: 'text-success',
			bgColor: 'bg-success/10',
			strokeColor: 'hsl(158 45% 40%)',
			category: 'polar',
			fullName: 'Asparagine',
			oneLetter: 'N'
		},
		Gln: {
			color: 'text-success',
			bgColor: 'bg-success/10',
			strokeColor: 'hsl(158 45% 40%)',
			category: 'polar',
			fullName: 'Glutamine',
			oneLetter: 'Q'
		},

		// Positively charged (Accent/Book Cloth tones)
		Lys: {
			color: 'text-accent',
			bgColor: 'bg-accent/10',
			strokeColor: '#CC785C',
			category: 'positive',
			fullName: 'Lysine',
			oneLetter: 'K'
		},
		Arg: {
			color: 'text-accent',
			bgColor: 'bg-accent/10',
			strokeColor: '#CC785C',
			category: 'positive',
			fullName: 'Arginine',
			oneLetter: 'R'
		},
		His: {
			color: 'text-accent',
			bgColor: 'bg-accent/10',
			strokeColor: '#CC785C',
			category: 'positive',
			fullName: 'Histidine',
			oneLetter: 'H'
		},

		// Negatively charged (Warning/Kraft tones)
		Asp: {
			color: 'text-warning',
			bgColor: 'bg-warning/15',
			strokeColor: '#D4A27F',
			category: 'negative',
			fullName: 'Aspartic Acid',
			oneLetter: 'D'
		},
		Glu: {
			color: 'text-warning',
			bgColor: 'bg-warning/15',
			strokeColor: '#D4A27F',
			category: 'negative',
			fullName: 'Glutamic Acid',
			oneLetter: 'E'
		},

		// Special/Modified (Muted tones)
		Aib: {
			color: 'text-muted-foreground',
			bgColor: 'bg-muted/50',
			strokeColor: '#91918D',
			category: 'modified',
			fullName: 'Aminoisobutyric Acid',
			oneLetter: 'U'
		}
	};

	const categories = [
		{ name: 'Hydrophobic', color: 'bg-muted', textColor: 'text-foreground' },
		{ name: 'Polar', color: 'bg-success/10', textColor: 'text-success' },
		{ name: 'Positive (+)', color: 'bg-accent/10', textColor: 'text-accent' },
		{ name: 'Negative (-)', color: 'bg-warning/15', textColor: 'text-warning' },
		{ name: 'Modified', color: 'bg-muted/50', textColor: 'text-muted-foreground' }
	];

	// Parse the sequence
	const aminoAcids = $derived(sequence ? sequence.split('-').map((aa) => aa.trim()) : []);

	function getAminoAcidStyle(aa: string) {
		return (
			aminoAcidProperties[aa] || {
				color: 'text-gray-700 dark:text-gray-300',
				bgColor: 'bg-gray-100 dark:bg-gray-800',
				strokeColor: '#6b7280',
				category: 'unknown',
				fullName: aa,
				oneLetter: '?'
			}
		);
	}

	// Render side chain structures using SmilesDrawer
	$effect(() => {
		// Dependencies: aminoAcids, isVisualizableSequence, sequence
		const aas = aminoAcids;
		const isViz = isVisualizableSequence;
		const seq = sequence; // Track sequence directly to ensure reactivity
		const container = structureContainer; // Capture for callback

		if (!isViz || !container || aas.length === 0) return;

		// Wait for DOM to update
		tick().then(() => {
			const drawer = new SmilesDrawer.SvgDrawer({
				width: 80,
				height: 60,
				bondThickness: 1.2,
				bondLength: 12,
				shortBondLength: 0.85,
				bondSpacing: 0.18 * 12,
				atomVisualization: 'default',
				isomeric: false,
				debug: false,
				terminalCarbons: false,
				explicitHydrogens: false,
				overlapSensitivity: 0.42,
				overlapResolutionIterations: 1,
				compactDrawing: true,
				fontSizeLarge: 5,
				fontSizeSmall: 3,
				padding: 5,
				themes: {
					light: {
						C: '#374151',
						O: '#dc2626',
						N: '#2563eb',
						S: '#ca8a04',
						H: '#6b7280',
						F: '#16a34a',
						CL: '#0d9488',
						BR: '#ea580c',
						I: '#7c3aed',
						P: '#ea580c',
						BACKGROUND: 'transparent'
					}
				}
			});

			// Render each side chain
			aas.forEach((aa, index) => {
				const smiles = sideChainSmiles[aa];
				if (!smiles) return; // Gly has no side chain

				const svgElement = container.querySelector(`#sidechain-${index}`);
				if (!svgElement) return;

				// Clear any existing content
				svgElement.innerHTML = '';

				SmilesDrawer.parse(
					smiles,
					(tree: unknown) => {
						drawer.draw(tree, svgElement, 'light');
					},
					() => {
						// Silently handle parse errors
					}
				);
			});
		});
	});
</script>

<div class="space-y-6">
	{#if isVisualizableSequence}
		{#key sequence}
			<!-- One-letter code display -->
			<div class="one-letter-display">
				<span class="shrink-0 text-xs font-medium text-muted-foreground">One-letter:</span>
				<code
					class="break-all rounded-lg bg-muted px-3 py-1.5 font-mono text-sm font-bold tracking-wider"
					>{oneLetterSequence}</code
				>
			</div>

			<!-- Peptide backbone with side chain structures (textbook style) -->
			<div class="relative overflow-x-auto py-4" bind:this={structureContainer}>
				<div class="inline-flex min-w-max items-start px-4">
					<!-- N-terminus -->
					<div class="mr-1 flex flex-col items-center justify-end">
						<div class="h-[60px]"></div>
						<div class="font-mono text-xs font-bold text-muted-foreground">H₂N</div>
					</div>

					{#each aminoAcids as aa, i (sequence + '-' + i + '-' + aa)}
						{@const style = getAminoAcidStyle(aa)}
						{@const hasSideChain =
							sideChainSmiles[aa] !== null && sideChainSmiles[aa] !== undefined}
						<div class="flex items-start">
							<!-- Amino acid residue -->
							<div class="flex flex-col items-center">
								<!-- Side chain structure (or H for glycine) -->
								<div class="mb-1 flex h-[60px] items-end justify-center">
									{#if hasSideChain}
										<svg
											id="sidechain-{i}"
											data-aa={aa}
											data-smiles={sideChainSmiles[aa]}
											width="80"
											height="60"
											class="block"
										></svg>
									{:else}
										<!-- Glycine - just show H -->
										<span class="font-mono text-sm text-muted-foreground">H</span>
									{/if}
								</div>

								<!-- Alpha carbon connection point (the backbone node) -->
								<div class="h-1.5 w-1.5 rounded-full bg-current {style.color} mb-1"></div>

								<!-- Amino acid label -->
								<div class="flex flex-col items-center">
									<span class="font-mono text-[10px] font-bold {style.color}"
										>{style.oneLetter}</span
									>
									<span class="font-mono text-[8px] text-muted-foreground">{i + 1}</span>
								</div>
							</div>

							<!-- Peptide bond connector (except after last residue) -->
							{#if i < aminoAcids.length - 1}
								<div class="mb-[20px] mt-[60px] flex items-center self-center">
									<div class="h-[1.5px] w-3 bg-muted-foreground/60"></div>
									<div class="mx-0.5 flex flex-col items-center">
										<span class="text-[8px] leading-none text-muted-foreground">O</span>
										<span class="text-[6px] leading-none text-muted-foreground">‖</span>
										<span class="text-[8px] leading-none text-muted-foreground">C</span>
									</div>
									<div class="h-[1.5px] w-1 bg-muted-foreground/60"></div>
									<span class="mx-0.5 text-[8px] text-muted-foreground">N</span>
									<div class="h-[1.5px] w-3 bg-muted-foreground/60"></div>
								</div>
							{/if}
						</div>
					{/each}

					<!-- C-terminus -->
					<div class="ml-1 flex flex-col items-center justify-end">
						<div class="h-[60px]"></div>
						<div class="flex items-center">
							<div class="h-[1.5px] w-2 bg-muted-foreground/60"></div>
							<span class="font-mono text-xs font-bold text-muted-foreground">COOH</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Three-letter code bead visualization -->
			<div class="relative">
				<!-- Chain backbone line -->
				<div class="absolute left-0 right-0 top-1/2 z-0 h-0.5 -translate-y-1/2 bg-border"></div>

				<!-- Amino acid beads -->
				<div class="relative z-10 flex flex-wrap items-center justify-center gap-1 py-2">
					{#each aminoAcids as aa, i (sequence + '-' + i + '-' + aa)}
						{@const style = getAminoAcidStyle(aa)}
						<div class="group relative">
							<!-- Connector line between beads -->
							{#if i > 0}
								<div
									class="absolute right-full top-1/2 h-0.5 w-1 -translate-y-1/2 bg-muted-foreground/40"
								></div>
							{/if}

							<!-- Amino acid bead -->
							<div
								class="flex h-10 w-10 items-center justify-center rounded-full {style.bgColor} {style.color} cursor-default border-2 border-white font-mono text-xs font-bold shadow-sm transition-all hover:scale-110 hover:shadow-md dark:border-gray-800"
								title="{style.fullName} ({aa})"
							>
								{aa.slice(0, 3)}
							</div>

							<!-- Position number -->
							<span
								class="absolute -bottom-4 left-1/2 -translate-x-1/2 font-mono text-[10px] text-muted-foreground"
							>
								{i + 1}
							</span>

							<!-- Tooltip -->
							<div
								class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
							>
								<p class="text-xs font-medium">{style.fullName}</p>
								<p class="text-[10px] text-muted-foreground">Position {i + 1}</p>
							</div>
						</div>
					{/each}
				</div>

				<!-- N and C terminus labels -->
				<div class="mt-6 flex justify-between font-mono text-xs text-muted-foreground">
					<span class="rounded bg-muted px-2 py-0.5">N-terminus</span>
					<span class="rounded bg-muted px-2 py-0.5">C-terminus</span>
				</div>
			</div>

			<!-- Legend -->
			{#if showLegend}
				<div class="flex flex-wrap justify-center gap-3 border-t border-border pt-4">
					{#each categories as cat}
						<div class="flex items-center gap-1.5">
							<div class="h-3 w-3 rounded-full {cat.color}"></div>
							<span class="text-xs text-muted-foreground">{cat.name}</span>
						</div>
					{/each}
				</div>
			{/if}
		{/key}
	{:else}
		<!-- Fallback for non-standard sequences -->
		<div class="py-4 text-center">
			<code class="inline-block break-all rounded-lg bg-muted px-3 py-2 font-mono text-sm"
				>{sequence}</code
			>
			<p class="mt-2 text-xs text-muted-foreground">Complex or non-standard sequence format</p>
		</div>
	{/if}
</div>

<style>
	.one-letter-display {
		display: flex;
		align-items: flex-start;
		justify-content: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	@media (max-width: 640px) {
		.one-letter-display {
			flex-direction: column;
			align-items: center;
		}

		.one-letter-display code {
			max-width: 100%;
			word-break: break-all;
			text-align: center;
		}
	}
</style>
