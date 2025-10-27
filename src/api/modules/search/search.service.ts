import { GoogleBooksService, TMDBMediaItem, TMDBService } from '@core/external'
import { Injectable, Logger } from '@nestjs/common'

import {
	SEARCH_MEDIA_TYPE,
	SearchMediaType,
	SearchQuery,
	SearchResponse,
	SearchResult
} from './search.types'

// Configuration for different search types
interface SearchConfig {
	maxPages: number
	maxResults: number
	parallelRequests: number
}

const SEARCH_CONFIGS: Record<SearchMediaType, SearchConfig> = {
	[SEARCH_MEDIA_TYPE.MOVIE.value]: {
		maxPages: 10,
		maxResults: 20,
		parallelRequests: 5
	},
	[SEARCH_MEDIA_TYPE.TV_SHOW.value]: {
		maxPages: 10,
		maxResults: 20,
		parallelRequests: 5
	},
	[SEARCH_MEDIA_TYPE.BOOK.value]: {
		maxPages: 5,
		maxResults: 40,
		parallelRequests: 3
	}
}

@Injectable()
export class SearchService {
	private readonly logger = new Logger(SearchService.name)

	constructor(
		private readonly tmdbService: TMDBService,
		private readonly googleBooksService: GoogleBooksService
	) {}

	async search(query: SearchQuery): Promise<SearchResponse> {
		const {
			query: searchQuery,
			mediaType = SEARCH_MEDIA_TYPE.MOVIE.value
		} = query

		if (!this.isValidQuery(searchQuery)) {
			return this.createEmptyResponse()
		}

		try {
			const results = await this.performSearch(searchQuery, mediaType)
			const processedResults = this.processResults(results, searchQuery)

			this.logger.log(
				`Final results for "${searchQuery}": ${processedResults.length}`
			)

			return {
				results: processedResults,
				totalResults: processedResults.length,
				hasMore: false
			}
		} catch (error) {
			this.logger.error(
				`Search error for "${searchQuery}": ${error.message}`
			)
			throw error
		}
	}

	// ===== VALIDATION =====
	private isValidQuery(query: string): boolean {
		if (!query?.trim()) return false
		return this.isLatinOnly(query.trim())
	}

	private isLatinOnly(query: string): boolean {
		return /^[a-zA-Z0-9\s\-'.,!?]+$/.test(query)
	}

	// ===== MAIN SEARCH LOGIC =====
	private async performSearch(
		query: string,
		mediaType: SearchMediaType
	): Promise<SearchResult[]> {
		const searchStrategies = {
			[SEARCH_MEDIA_TYPE.MOVIE.value]: () =>
				this.searchMedia(query, 'movies'),
			[SEARCH_MEDIA_TYPE.TV_SHOW.value]: () =>
				this.searchMedia(query, 'tv'),
			[SEARCH_MEDIA_TYPE.BOOK.value]: () => this.searchBooks(query)
		}

		const searchFn =
			searchStrategies[mediaType] ||
			searchStrategies[SEARCH_MEDIA_TYPE.MOVIE.value]
		return await searchFn()
	}

	private async searchMedia(
		query: string,
		type: 'movies' | 'tv'
	): Promise<SearchResult[]> {
		const config =
			SEARCH_CONFIGS[
				type === 'movies'
					? SEARCH_MEDIA_TYPE.MOVIE.value
					: SEARCH_MEDIA_TYPE.TV_SHOW.value
			]

		try {
			const searchFn =
				type === 'movies'
					? (q: string, p: number) =>
							this.tmdbService.searchMovies(q, { page: p })
					: (q: string, p: number) =>
							this.tmdbService.searchTVShows(q, { page: p })

			await this.tmdbService
				.getGenreMap(type === 'movies' ? 'movie' : 'tv')
				.catch(() => undefined)

			const responses = await this.executeParallelSearch(
				searchFn,
				query,
				config.maxPages
			)
			return this.deduplicateResults(
				responses.flatMap(response =>
					response.results.map(item =>
						this.mapTMDBToSearchResult(item)
					)
				)
			)
		} catch (error) {
			this.logger.error(`Error searching ${type}: ${error.message}`)
			return []
		}
	}

	private async searchBooks(query: string): Promise<SearchResult[]> {
		const config = SEARCH_CONFIGS[SEARCH_MEDIA_TYPE.BOOK.value]

		try {
			// Combine title search and general search
			const [titleResults, generalResults] = await Promise.all([
				this.searchBooksByTitle(query, config),
				this.searchBooksGeneral(query, config)
			])

			const allResults = [...titleResults, ...generalResults]
			return this.deduplicateResults(
				allResults.filter(result => this.isBookRelevant(result, query))
			)
		} catch (error) {
			this.logger.error(`Error searching books: ${error.message}`)
			return []
		}
	}

	private async searchBooksByTitle(
		query: string,
		config: SearchConfig
	): Promise<SearchResult[]> {
		const promises = Array.from(
			{ length: config.parallelRequests },
			(_, i) =>
				this.googleBooksService.searchBooksByTitle(
					query,
					i * config.maxResults,
					config.maxResults
				)
		)
		const responses = await Promise.all(promises)
		return this.extractBooksFromResponses(responses)
	}

	private async searchBooksGeneral(
		query: string,
		config: SearchConfig
	): Promise<SearchResult[]> {
		const requestCount = Math.max(
			1,
			Math.floor(config.parallelRequests / 2)
		)
		const promises = Array.from({ length: requestCount }, (_, i) =>
			this.googleBooksService.searchBooks(
				query,
				i * config.maxResults,
				config.maxResults
			)
		)
		const responses = await Promise.all(promises)
		return this.extractBooksFromResponses(responses)
	}

	// ===== HELPER METHODS =====
	private async executeParallelSearch<T>(
		searchFn: (query: string, page: number) => Promise<{ results: T[] }>,
		query: string,
		maxPages: number
	): Promise<{ results: T[] }[]> {
		const promises = Array.from({ length: maxPages }, (_, i) =>
			searchFn(query, i + 1)
		)
		return await Promise.all(promises)
	}

	private extractBooksFromResponses(responses: any[]): SearchResult[] {
		return responses
			.filter(response => response.items?.length > 0)
			.flatMap(response =>
				response.items.map((item: any) =>
					this.mapGoogleBooksToSearchResult(item)
				)
			)
	}

	private deduplicateResults(results: SearchResult[]): SearchResult[] {
		const seenIds = new Set<string>()
		return results.filter(result => {
			if (seenIds.has(result.id)) return false
			seenIds.add(result.id)
			return true
		})
	}

	// ===== PROCESSING RESULTS =====
	private processResults(
		results: SearchResult[],
		query: string
	): SearchResult[] {
		return this.sortResultsByRelevance(
			this.filterByTitleMatch(this.filterEnglishResults(results), query),
			query
		)
	}

	private filterEnglishResults(results: SearchResult[]): SearchResult[] {
		return results.filter(result => {
			const textToCheck = `${result.title || ''} ${result.subtitle || ''}`
			return !/[а-яёіїєґ]/i.test(textToCheck)
		})
	}

	private filterByTitleMatch(
		results: SearchResult[],
		query: string
	): SearchResult[] {
		const normalizedQuery = this.normalizeString(query)
		const queryWords = this.getQueryWords(normalizedQuery)

		return results.filter(result => {
			const normalizedTitle = this.normalizeString(result.title || '')
			return (
				normalizedTitle.includes(normalizedQuery) ||
				this.containsWordsInOrder(normalizedTitle, queryWords)
			)
		})
	}

	// ===== SORTING =====
	private sortResultsByRelevance(
		results: SearchResult[],
		query: string
	): SearchResult[] {
		return results.sort((a, b) => {
			// First by relevance
			const relevanceDiff =
				this.getRelevanceScore(b, query) -
				this.getRelevanceScore(a, query)
			if (relevanceDiff !== 0) return relevanceDiff

			// Then by data completeness
			const completenessDiff =
				this.getCompletenessScore(b) - this.getCompletenessScore(a)
			if (completenessDiff !== 0) return completenessDiff

			// Finally by rating
			return (b.rating || 0) - (a.rating || 0)
		})
	}

	private getRelevanceScore(result: SearchResult, query: string): number {
		const normalizedQuery = this.normalizeString(query)
		const normalizedTitle = this.normalizeString(result.title || '')
		const queryWords = this.getQueryWords(normalizedQuery)

		// Score system for relevance
		const scores = {
			exactMatch: 100,
			startsWith: 80,
			contains: 60,
			wordsInOrder: 40,
			allWordsPresent: 20
		}

		let score = 0

		if (normalizedTitle === normalizedQuery) score += scores.exactMatch
		else if (normalizedTitle.startsWith(normalizedQuery))
			score += scores.startsWith
		else if (normalizedTitle.includes(normalizedQuery))
			score += scores.contains
		else if (this.containsWordsInOrder(normalizedTitle, queryWords))
			score += scores.wordsInOrder

		// Bonus for presence of all words
		const allWordsPresent = queryWords.every(word =>
			normalizedTitle.includes(word)
		)
		if (allWordsPresent) score += scores.allWordsPresent

		// Bonus for percentage of matches
		const matchingWords = queryWords.filter(word =>
			normalizedTitle.includes(word)
		).length
		score += (matchingWords / queryWords.length) * 10

		return score
	}

	private getCompletenessScore(result: SearchResult): number {
		let score = 0

		// Weight system for different fields
		if (result.title) score += 1
		if (result.imageUrl) score += 4
		if (result.description || result.subtitle) score += 3
		if (result.rating && result.rating > 0) score += 2
		if (result.year) score += 1

		return score
	}

	// ===== UTILITY FUNCTIONS =====
	private normalizeString(str: string): string {
		return str
			.toLowerCase()
			.replace(/[^\w\s]/g, ' ')
			.replace(/\s+/g, ' ')
			.trim()
	}

	private getQueryWords(normalizedQuery: string): string[] {
		return normalizedQuery.split(/\s+/).filter(word => word.length > 0)
	}

	private containsWordsInOrder(text: string, words: string[]): boolean {
		if (words.length === 0) return true
		if (words.length === 1) return text.includes(words[0])

		let currentIndex = 0
		for (const word of words) {
			const wordIndex = text.indexOf(word, currentIndex)
			if (wordIndex === -1) return false
			currentIndex = wordIndex + word.length
		}
		return true
	}

	// ===== BOOK VALIDATION =====
	private isBookRelevant(book: SearchResult, query: string): boolean {
		const queryWords = this.getQueryWords(query.toLowerCase())

		if (query.length <= 2) return true

		const searchableText = [
			book.title?.toLowerCase() || '',
			book.subtitle?.toLowerCase() || '',
			book.description?.toLowerCase() || ''
		]

		// Priority search: title > subtitle > description
		const titleMatch = queryWords.some(word =>
			searchableText[0].includes(word)
		)
		const subtitleMatch = queryWords.some(word =>
			searchableText[1].includes(word)
		)
		const descriptionMatch = queryWords.some(word =>
			searchableText[2].includes(word)
		)

		return (
			titleMatch ||
			subtitleMatch ||
			(descriptionMatch && queryWords.length <= 2)
		)
	}

	// ===== MAPPER =====
	private mapTMDBToSearchResult(item: TMDBMediaItem): SearchResult {
		const date = item.release_date || item.first_air_date
		const year = date ? new Date(date).getFullYear().toString() : undefined
		const mediaType =
			item.media_type === 'movie'
				? SEARCH_MEDIA_TYPE.MOVIE.value
				: SEARCH_MEDIA_TYPE.TV_SHOW.value

		return {
			id: `tmdb_${item.id}`,
			title: item.title || item.name || '',
			subtitle: item.overview,
			description: item.overview,
			imageUrl: item.poster_path
				? `https://image.tmdb.org/t/p/w500${item.poster_path}`
				: undefined,
			year,
			rating: item.vote_average,
			genres: this.mapTMDBGenres(item),
			type: mediaType,
			source: 'tmdb',
			externalId: item.id.toString()
		}
	}

	private mapTMDBGenres(item: TMDBMediaItem): string[] | undefined {
		const type = item.media_type === 'movie' ? 'movie' : 'tv'
		return this.tmdbService.mapGenreIdsToNames(type, item.genre_ids)
	}

	private mapGoogleBooksToSearchResult(item: any): SearchResult {
		const { volumeInfo } = item
		const year = volumeInfo?.publishedDate
			? new Date(volumeInfo.publishedDate).getFullYear().toString()
			: undefined
		const authors = volumeInfo?.authors?.join(', ')

		return {
			id: `google_books_${item.id}`,
			title: volumeInfo?.title || '',
			subtitle: authors,
			description: volumeInfo?.description,
			imageUrl: volumeInfo?.imageLinks?.thumbnail,
			year,
			rating: volumeInfo?.averageRating,
			genres: volumeInfo?.categories,
			type: SEARCH_MEDIA_TYPE.BOOK.value,
			source: 'google_books',
			externalId: item.id
		}
	}

	private createEmptyResponse(): SearchResponse {
		return {
			results: [],
			totalResults: 0,
			hasMore: false
		}
	}
}
