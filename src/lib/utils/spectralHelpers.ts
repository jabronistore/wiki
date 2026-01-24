export interface BandData {
	sensorId: string;
	sensorName: string;
	bandName: string;
	minWavelength: number;
	maxWavelength: number;
	centerWavelength: number;
	color: string;
	yPosition?: number;
}

export interface SensorBands {
	sensorId: string;
	sensorName: string;
	provider: string;
	bands: BandData[];
	yOffset: number;
}

// Get color based on wavelength and band name
export function getBandColor(wavelength: number, bandName: string): string {
	const bandLower = bandName.toLowerCase();

	// Special cases for named bands
	if (bandLower.includes('pan')) return '#6b7280'; // gray for panchromatic
	if (bandLower.includes('coastal')) return '#8b5cf6'; // violet
	if (bandLower.includes('blue')) return '#3b82f6';
	if (bandLower.includes('green')) return '#22c55e';
	if (bandLower.includes('yellow')) return '#eab308';
	if (bandLower.includes('red edge')) return '#f97316';
	if (bandLower.includes('red')) return '#ef4444';
	if (bandLower.includes('nir')) return '#7c3aed';
	if (bandLower.includes('swir')) return '#dc2626';
	if (bandLower.includes('mwir')) return '#991b1b';
	if (bandLower.includes('tir') || bandLower.includes('thermal')) return '#7f1d1d';

	// Color based on wavelength if no name match
	return getSpectralRegionColor(wavelength);
}

// Get color for a specific wavelength
export function getSpectralRegionColor(wavelength: number): string {
	if (wavelength < 380) return '#4c1d95'; // UV
	if (wavelength < 450) return '#8b5cf6'; // violet
	if (wavelength < 495) return '#3b82f6'; // blue
	if (wavelength < 570) return '#22c55e'; // green
	if (wavelength < 590) return '#eab308'; // yellow
	if (wavelength < 620) return '#f59e0b'; // orange
	if (wavelength < 750) return '#ef4444'; // red
	if (wavelength < 1400) return '#7c3aed'; // NIR
	if (wavelength < 3000) return '#dc2626'; // SWIR
	if (wavelength < 8000) return '#991b1b'; // MWIR
	return '#7f1d1d'; // LWIR/TIR
}

// Calculate vertical positions for sensors to minimize overlap
export function calculateSensorPositions(
	selectedSensors: any[],
	bandHeight: number = 20,
	sensorSpacing: number = 5
): SensorBands[] {
	const result: SensorBands[] = [];
	let currentY = 0;

	for (const sensor of selectedSensors) {
		// Sort bands so panchromatic comes first (will be rendered behind others)
		const sortedBands = [...sensor.bands].sort((a: any, b: any) => {
			const aPan = a.name.toLowerCase().includes('pan');
			const bPan = b.name.toLowerCase().includes('pan');
			if (aPan && !bPan) return -1;
			if (!aPan && bPan) return 1;
			return 0;
		});

		const sensorBands: BandData[] = sortedBands.map((band: any) => ({
			sensorId: sensor.id,
			sensorName: sensor.name,
			bandName: band.name,
			minWavelength: band.minWavelength,
			maxWavelength: band.maxWavelength,
			centerWavelength: band.centerWavelength,
			color: getBandColor(band.centerWavelength, band.name),
			yPosition: currentY
		}));

		result.push({
			sensorId: sensor.id,
			sensorName: sensor.name,
			provider: sensor.provider,
			bands: sensorBands,
			yOffset: currentY
		});

		currentY += bandHeight + sensorSpacing;
	}

	return result;
}

// Group sensors by provider
export function groupSensorsByProvider(sensors: any[]) {
	const groups: Record<string, any[]> = {};

	for (const sensor of sensors) {
		const provider = sensor.provider || 'Other';
		if (!groups[provider]) {
			groups[provider] = [];
		}
		groups[provider].push(sensor);
	}

	// Sort providers and sensors within each provider
	const sortedProviders = Object.keys(groups).sort();
	sortedProviders.forEach((provider) => {
		groups[provider].sort((a, b) => a.name.localeCompare(b.name));
	});

	return { groups, providers: sortedProviders };
}

// Common sensor presets
export const SENSOR_PRESETS = {
	'Common RGB': ['sentinel-2', 'worldview-3', 'worldview-2', 'superview-1'],
	Hyperspectral: ['dragonette-001', 'dragonette-002'],
	'High Resolution': ['worldview-3', 'worldview-legion', 'bj3n', 'superview-30cm'],
	'Sentinel Family': ['sentinel-2'],
	'WorldView Family': [
		'worldview-1',
		'worldview-2',
		'worldview-3',
		'worldview-4',
		'worldview-legion'
	],
	'Asian Constellation': [
		'gaofen-1',
		'gaofen-2',
		'jl1-50cm',
		'jl1-75cm',
		'bj3a',
		'bj3n',
		'superview-1',
		'superview-2'
	]
};

// Format wavelength for display
export function formatWavelength(value: number): string {
	if (value < 1000) {
		return `${Math.round(value)}nm`;
	} else {
		return `${(value / 1000).toFixed(1)}μm`;
	}
}

// Parse wavelength string to extract numeric values
export function parseWavelength(
	wavelengthStr: string
): { min: number; max: number; center: number } | null {
	const str = wavelengthStr.toLowerCase();

	// Handle FWHM format: "503 nm (20.1 nm FWHM)"
	const fwhmMatch = str.match(/(\d+(?:\.\d+)?)\s*nm\s*\((\d+(?:\.\d+)?)\s*nm\s*fwhm\)/);
	if (fwhmMatch) {
		const center = parseFloat(fwhmMatch[1]);
		const fwhm = parseFloat(fwhmMatch[2]);
		return {
			min: center - fwhm / 2,
			max: center + fwhm / 2,
			center
		};
	}

	// Extract just the wavelength numbers, removing any text in parentheses
	const cleanStr = str.replace(/\([^)]*\)/g, '').trim();

	// Handle range formats: "450-800 nm"
	const rangeMatch = cleanStr.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
	if (rangeMatch) {
		const min = parseFloat(rangeMatch[1]);
		const max = parseFloat(rangeMatch[2]);
		return { min, max, center: (min + max) / 2 };
	}

	// Handle single wavelength: "443 nm"
	const singleMatch = cleanStr.match(/(\d+(?:\.\d+)?)/);
	if (singleMatch) {
		const value = parseFloat(singleMatch[1]);
		// For single wavelengths, create a small range (±10nm)
		return {
			min: value - 10,
			max: value + 10,
			center: value
		};
	}

	return null;
}
