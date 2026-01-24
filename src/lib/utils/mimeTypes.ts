// src/lib/utils/mimeTypes.ts

const mimeTypes: { [key: string]: string } = {
	'.kml': 'application/vnd.google-earth.kml+xml',
	'.kmz': 'application/vnd.google-earth.kmz',
	'.geojson': 'application/geo+json',
	'.shp': 'application/octet-stream', // SHP files are binary; adjust if a more specific MIME type is needed
	'.zip': 'application/zip',
	// Add other necessary mappings if needed
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.png': 'image/png',
	'.gif': 'image/gif',
	'.pdf': 'application/pdf',
	'.doc': 'application/msword',
	'.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'.xls': 'application/vnd.ms-excel',
	'.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	'.ppt': 'application/vnd.ms-powerpoint',
	'.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
	'.txt': 'text/plain',
	'.csv': 'text/csv'
	// ... add more as necessary
};

/**
 * Returns the MIME type based on the file extension.
 * Defaults to 'application/octet-stream' if the extension is not recognized.
 * @param filename - The name of the file
 * @returns The corresponding MIME type as a string
 */
export function getMimeType(filename: string): string {
	const extensionMatch = filename.match(/\.[^/.]+$/);
	const extension = extensionMatch ? extensionMatch[0].toLowerCase() : '';
	return mimeTypes[extension] || 'application/octet-stream';
}
