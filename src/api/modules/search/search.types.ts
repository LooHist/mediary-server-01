export const SEARCH_MEDIA_TYPE = {
	MOVIE: { value: 'movie', label: 'Movies' },
	TV_SHOW: { value: 'tv_show', label: 'Serials' },
	BOOK: { value: 'book', label: 'Books' }
} as const

export type SearchMediaType =
	(typeof SEARCH_MEDIA_TYPE)[keyof typeof SEARCH_MEDIA_TYPE]['value']

export interface SearchResult {
	id: string
	title: string
	subtitle?: string
	description?: string
	imageUrl?: string
	year?: string
	rating?: number
	genres?: string[]
	type: SearchMediaType
	source: 'tmdb' | 'google_books' | 'local'
	externalId?: string
}

export interface SearchResponse {
	results: SearchResult[]
	totalResults: number
	hasMore: boolean
}

export interface SearchQuery {
	query: string
	mediaType?: SearchMediaType
}
