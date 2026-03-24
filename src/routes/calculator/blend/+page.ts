// Can't prerender because we use URL searchParams for initial blend
export const prerender = false;

const blendNames: Record<string, string> = {
	klow: 'KLOW',
	glow: 'GLOW',
	'cjc-ipa': 'CJC/IPA',
	wolverine: 'Wolverine',
	'tri-heal-max': 'Tri-Heal Max',
	'tesa-ipa': 'Tesa/IPA',
	illumineuro: 'IllumiNeuro',
	custom: 'Custom'
};

export function load({ url }) {
	const blendId = url.searchParams.get('b') || 'klow';
	const blendName = blendNames[blendId] || null;

	return {
		initialBlendId: blendId,
		blendName
	};
}
