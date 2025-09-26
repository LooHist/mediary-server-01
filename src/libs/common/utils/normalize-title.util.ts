/**
 * Normalizes a title for search purposes
 * - Converts to lowercase
 * - Removes special characters (keeps only letters, numbers, and spaces)
 * - Replaces multiple spaces with single space
 * - Trims whitespace
 */
export function normalizeTitle(title: string): string {
	return title
		.toLowerCase()
		.replace(/[^\p{L}\p{N}\s]/gu, '') // Remove special characters, keep letters, numbers, spaces
		.replace(/\s+/g, ' ') // Replace multiple spaces with single space
		.trim()
}
