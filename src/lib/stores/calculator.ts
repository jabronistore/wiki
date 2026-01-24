import { writable } from 'svelte/store';

// Store for current calculator peptide info (for reactive title updates)
export const currentCalculatorPeptide = writable<{
	id: string | null;
	name: string | null;
}>({ id: null, name: null });

// Store for current blend info (for reactive title updates)
export const currentBlend = writable<{
	id: string | null;
	name: string | null;
}>({ id: null, name: null });

// Store for current reconstitution calculator peptide (for reactive title updates)
export const currentReconstitutionPeptide = writable<{
	id: string | null;
	name: string | null;
}>({ id: null, name: null });
