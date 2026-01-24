<script lang="ts">
	import { onMount } from 'svelte';
	import { List } from 'lucide-svelte';

	interface Props {
		sections: { id: string; title: string; show: boolean }[];
	}

	let { sections }: Props = $props();

	let activeSection = $state('');
	let observer: IntersectionObserver | null = null;

	// Filter to only visible sections
	const visibleSections = $derived(sections.filter((s) => s.show));

	onMount(() => {
		// Find the main scrollable container
		const scrollContainer = document.querySelector('.peptide-main') as HTMLElement | null;

		// Set up IntersectionObserver with the correct root
		const options: IntersectionObserverInit = {
			root: scrollContainer,
			rootMargin: '-80px 0px -60% 0px',
			threshold: [0, 0.1, 0.25, 0.5, 0.75, 1]
		};

		observer = new IntersectionObserver((entries) => {
			let mostVisibleId: string | null = null;
			let highestRatio = 0;

			entries.forEach((entry) => {
				if (entry.isIntersecting && entry.intersectionRatio > highestRatio) {
					mostVisibleId = entry.target.id;
					highestRatio = entry.intersectionRatio;
				}
			});

			if (mostVisibleId) {
				activeSection = mostVisibleId;
			}
		}, options);

		// Observe all section elements
		visibleSections.forEach((section) => {
			const element = document.getElementById(section.id);
			if (element) {
				observer?.observe(element);
			}
		});

		// Backup scroll listener for fallback - listens to the scroll container
		const handleScroll = () => {
			if (!scrollContainer) return;
			const scrollPosition = scrollContainer.scrollTop + 150;

			for (let i = visibleSections.length - 1; i >= 0; i--) {
				const section = visibleSections[i];
				const element = document.getElementById(section.id);
				if (element && element.offsetTop <= scrollPosition) {
					if (activeSection !== section.id) {
						activeSection = section.id;
					}
					break;
				}
			}
		};

		if (scrollContainer) {
			scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
		}

		// Set initial active section
		if (visibleSections.length > 0) {
			activeSection = visibleSections[0].id;
		}

		return () => {
			observer?.disconnect();
			if (scrollContainer) {
				scrollContainer.removeEventListener('scroll', handleScroll);
			}
		};
	});

	function scrollToSection(id: string) {
		const element = document.getElementById(id);
		const scrollContainer = document.querySelector('.peptide-main') as HTMLElement | null;

		if (element && scrollContainer) {
			const headerOffset = 32;
			const elementPosition = element.offsetTop;
			const offsetPosition = elementPosition - headerOffset;

			scrollContainer.scrollTo({
				top: offsetPosition,
				behavior: 'smooth'
			});

			// Also expand the section if it's collapsed
			const button = element.querySelector('button');
			if (button) {
				const isExpanded = element.querySelector('.animate-fade-in');
				if (!isExpanded) {
					button.click();
				}
			}
		}
	}
</script>

<nav class="space-y-1">
	<div class="mb-4 flex items-center gap-2 px-3">
		<List class="h-4 w-4 text-muted-foreground" />
		<span class="text-sm font-semibold text-muted-foreground">On this page</span>
	</div>

	<div class="space-y-0.5">
		{#each visibleSections as section}
			<button
				onclick={() => scrollToSection(section.id)}
				class="group relative w-full rounded-lg px-3 py-2 text-left text-sm transition-all duration-200 {activeSection ===
				section.id
					? 'bg-primary/10 font-medium text-primary'
					: 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}"
			>
				<!-- Active indicator line -->
				<span
					class="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary transition-all duration-200 {activeSection ===
					section.id
						? 'opacity-100'
						: 'opacity-0'}"
				></span>
				<span class="block pl-1">{section.title}</span>
			</button>
		{/each}
	</div>
</nav>
