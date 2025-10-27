/**
 * Sanitizes plain text: removes HTML, normalizes line breaks,
 * removes non-printable characters, truncates to maxLen.
 */
export function sanitizePlainText(
	input: string | null | undefined,
	maxLen: number = 500
): string | undefined {
	if (input == null) return undefined

	let text = String(input)

	// Remove HTML tags
	text = text.replace(/<[^>]*>/g, '')

	// Normalize line breaks and remove null characters
	text = text.replace(/\r\n?/g, '\n').replace(/\u0000/g, '')

	// Remove extra spaces at the edges
	text = text.trim()

	// Strict length limit for security
	if (text.length > maxLen) {
		text = text.slice(0, maxLen)
	}

	return text
}
