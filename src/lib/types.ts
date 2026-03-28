// Peptide data types for Peptide Database

export interface QuickStats {
	typicalDose: string;
	frequency: string;
	cycleDuration: string;
	storage: string;
}

export interface MolecularInfo {
	weight?: string;
	length?: string;
	sequence?: string;
	type?: string;
	modifications?: string[];
	halfLife?: string;
	halfLifeSeconds?: number;
	halfLifeRoute?: string;
}

export interface IndicationItem {
	name: string;
	description?: string;
	effectiveness?: 'most-effective' | 'effective' | 'moderate' | 'emerging';
}

export interface IndicationCategory {
	category: string;
	items: IndicationItem[];
}

export interface Protocol {
	goal: string;
	dose: string;
	frequency: string;
	route: string;
	notes?: string;
}

export interface ReconstitutionInfo {
	materials?: string[];
	steps: string[];
	quickStart?: string[];
}

export interface DeliveryMethod {
	type: 'injectable' | 'oral' | 'nasal' | 'topical' | 'sublingual';
	available: boolean;
	overview?: string;
	protocols: Protocol[];
	reconstitution?: ReconstitutionInfo;
	keyBenefits?: string[];
}

export interface Interaction {
	peptide: string;
	status: 'synergistic' | 'compatible' | 'monitor' | 'avoid' | 'requires-timing';
	notes?: string;
}

export interface TimelineEntry {
	period: string;
	effects: string;
}

export interface SideEffects {
	common: string[];
	rare?: string[];
	stopSigns: string[];
	contraindications?: string[];
	monitoring?: string[];
}

export interface QualityChecklist {
	good: string[];
	warning: string[];
	bad: string[];
}

export interface Reference {
	title: string;
	authors?: string;
	year?: string;
	journal?: string;
	url?: string;
	participants?: string;
	keyFindings?: string;
}

export interface LatestResearch {
	title: string;
	date: string;
	source?: string;
	summary?: string;
}

export interface ProtocolVariantDose {
	phase: string;
	dose: string;
	frequency: string;
	duration?: string;
}

export interface ProtocolVariant {
	name: string;
	source: string;
	sourceUrl?: string;
	philosophy: string;
	description: string;
	keyDifferences: string[];
	doses: ProtocolVariantDose[];
}

export interface Peptide {
	id: string;
	name: string;
	subtitle?: string;
	aliases?: string[];
	compoundKind?: CompoundKind;
	categories: PeptideCategory[];
	researchStatus: ResearchStatus;
	fdaApproved?: boolean;

	quickStats: QuickStats;
	molecular?: MolecularInfo;

	overview: string;
	mechanism?: string;
	keyBenefits: string[];

	indications: IndicationCategory[];
	deliveryMethods: DeliveryMethod[];
	interactions?: Interaction[];

	timeline?: TimelineEntry[];
	sideEffects?: SideEffects;
	qualityChecklist?: QualityChecklist;

	references?: Reference[];
	latestResearch?: LatestResearch[];

	protocolVariants?: ProtocolVariant[];

	blendComposition?: BlendComposition;
}

export interface BlendComponent {
	name: string;
	amount: number;
	ratio: number;
}

export interface BlendComposition {
	totalAmount: number;
	unit: string;
	components: BlendComponent[];
}

export type PeptideCategory =
	| 'healing'
	| 'growth-hormone'
	| 'weight-loss'
	| 'cognitive'
	| 'longevity'
	| 'skin'
	| 'immune'
	| 'sexual-health'
	| 'sleep'
	| 'metabolic'
	| 'protocol'
	| 'pct'
	| 'hair-loss'
	| 'anabolic'
	| 'pde5'
	| 'sarm'
	| 'other';

export type CompoundKind =
	| 'peptide'
	| 'sarm'
	| 'anabolic'
	| 'pharmaceutical'
	| 'ancillary'
	| 'bioregulator';

export type Compound = Peptide;

export type ResearchStatus =
	| 'extensively-studied'
	| 'well-studied'
	| 'moderate-research'
	| 'emerging'
	| 'limited-research'
	| 'fda-approved';

export interface PeptideManifest {
	peptides: PeptideSummary[];
	categories: { id: PeptideCategory; name: string; count: number }[];
	lastUpdated: string;
}

export interface PeptideSummary {
	id: string;
	name: string;
	subtitle?: string;
	alias?: string;
	compoundKind?: CompoundKind;
	categories: PeptideCategory[];
	researchStatus: ResearchStatus;
	/** Flattened searchable text: indication names, aliases, mechanism keywords */
	searchText?: string;
}

// Guide types
export type GuideCategory =
	| 'basics'
	| 'safety'
	| 'protocols'
	| 'research-methods'
	| 'equipment'
	| 'troubleshooting';

export type GuideDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface GuideAuthorSocial {
	twitter?: string;
	linkedin?: string;
	github?: string;
}

export interface RelatedGuide {
	title: string;
	slug: string;
	image?: string;
	excerpt?: string;
}

export interface Guide {
	slug: string;
	title: string;
	description: string;
	date: string;
	lastUpdated?: string;
	author: string;
	authorBio?: string;
	authorImage?: string;
	authorUrl?: string;
	authorSocial?: GuideAuthorSocial;
	category: GuideCategory;
	difficulty: GuideDifficulty;
	readingTime: string;
	tags: string[];
	image?: string;
	imageAlt?: string;
	invertImageInDark?: boolean;
	published: boolean;
	keywords?: string;
	canonical?: string;
	showToc?: boolean;
	relatedPeptides?: string[];
	relatedGuides?: RelatedGuide[];
}

export interface GuideSummary {
	slug: string;
	title: string;
	description: string;
	date: string;
	category: GuideCategory;
	difficulty: GuideDifficulty;
	readingTime: string;
}
