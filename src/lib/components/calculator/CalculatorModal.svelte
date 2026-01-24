<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import PeptideCalculator from './PeptideCalculator.svelte';
	import BlendCalculator from './BlendCalculator.svelte';
	import { Calculator, Beaker, X } from 'lucide-svelte';
	import type { Peptide } from '$lib/types';

	interface Props {
		peptide?: Peptide;
		buttonVariant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
		buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
		buttonClass?: string;
	}

	let { peptide, buttonVariant = 'outline', buttonSize = 'sm', buttonClass = '' }: Props = $props();

	let open = $state(false);

	// Check if this is a blend
	const isBlend = $derived(!!peptide?.blendComposition);

	// Parse typical dose from peptide data
	function parseTypicalDose(doseString?: string): number {
		if (!doseString) return 250;
		// Extract first number from strings like "250-500mcg" or "250 mcg"
		const match = doseString.match(/(\d+(?:\.\d+)?)/);
		return match ? parseFloat(match[1]) : 250;
	}

	const defaultDose = $derived(parseTypicalDose(peptide?.quickStats?.typicalDose));
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger asChild let:builder>
		<Button builders={[builder]} variant={buttonVariant} size={buttonSize} class={buttonClass}>
			{#if isBlend}
				<Beaker class="mr-2 h-4 w-4" />
				Blend Calculator
			{:else}
				<Calculator class="mr-2 h-4 w-4" />
				Calculator
			{/if}
		</Button>
	</Dialog.Trigger>
	<Dialog.Content class="calculator-modal-content max-h-[90vh] max-w-3xl overflow-y-auto">
		<!-- Mobile close button - large and always visible -->
		<button class="mobile-close-btn" onclick={() => (open = false)} aria-label="Close calculator">
			<X class="h-6 w-6" />
		</button>

		<Dialog.Header>
			<Dialog.Title>
				{#if peptide}
					{peptide.name} {isBlend ? 'Blend' : 'Reconstitution'} Calculator
				{:else}
					Peptide Reconstitution Calculator
				{/if}
			</Dialog.Title>
			<Dialog.Description>
				{#if isBlend}
					Calculate your blend dose by anchoring to any component.
				{:else}
					Calculate your dose and see exactly how much to draw in your syringe.
				{/if}
			</Dialog.Description>
		</Dialog.Header>
		<div class="py-4">
			{#if isBlend && peptide?.blendComposition}
				<BlendCalculator
					presetBlend={{
						id: peptide.id,
						name: peptide.name,
						totalAmount: peptide.blendComposition.totalAmount,
						unit: peptide.blendComposition.unit,
						components: peptide.blendComposition.components
					}}
				/>
			{:else}
				<PeptideCalculator peptideName={peptide?.name} {defaultDose} compact />
			{/if}
		</div>
		<Dialog.Footer class="mobile-close-footer">
			<Button variant="outline" onclick={() => (open = false)} class="w-full sm:w-auto">
				Done
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<style>
	/* Mobile close button - always visible on mobile */
	.mobile-close-btn {
		display: none;
	}

	:global(.calculator-modal-content) {
		width: calc(100% - 2rem);
		max-height: calc(100vh - 2rem);
	}

	@media (max-width: 640px) {
		/* Large, prominent close button for mobile - positioned in safe area */
		.mobile-close-btn {
			display: flex;
			align-items: center;
			justify-content: center;
			position: fixed;
			top: calc(1rem + env(safe-area-inset-top, 20px));
			right: 1rem;
			width: 48px;
			height: 48px;
			border-radius: 50%;
			background: hsl(var(--background));
			border: 2px solid hsl(var(--border));
			color: hsl(var(--foreground));
			z-index: 9999;
			cursor: pointer;
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
			-webkit-tap-highlight-color: transparent;
		}

		.mobile-close-btn:active {
			transform: scale(0.9);
			background: hsl(var(--muted));
		}

		/* Hide the default tiny X button on mobile */
		:global(.calculator-modal-content > button:last-of-type) {
			display: none !important;
		}

		:global(.calculator-modal-content) {
			position: fixed;
			top: env(safe-area-inset-top, 20px);
			left: 0.5rem;
			right: 0.5rem;
			bottom: env(safe-area-inset-bottom, 20px);
			width: auto;
			max-width: none;
			max-height: none;
			height: auto;
			transform: none;
			padding: 1rem;
			padding-top: 4rem; /* Room for close button */
			border-radius: 1rem;
			overflow-y: auto;
			-webkit-overflow-scrolling: touch;
		}

		:global(.calculator-modal-content [data-dialog-header]) {
			padding-bottom: 0.5rem;
		}

		:global(.calculator-modal-content .py-4) {
			padding-top: 0.5rem;
			padding-bottom: 0.5rem;
		}

		:global(.mobile-close-footer) {
			padding-top: 1rem;
			padding-bottom: 0.5rem;
			border-top: 1px solid hsl(var(--border));
			margin-top: 1rem;
			position: sticky;
			bottom: 0;
			background: hsl(var(--background));
		}
	}
</style>
