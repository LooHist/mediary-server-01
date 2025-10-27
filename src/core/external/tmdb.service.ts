import { getTMDBConfig } from '@config/tmdb.config'
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { HttpRetryService } from './http-retry.service'

export interface TMDBMediaItem {
	id: number
	title?: string
	name?: string
	overview: string
	poster_path: string | null
	backdrop_path?: string | null
	release_date?: string
	first_air_date?: string
	media_type: 'movie' | 'tv'
	genre_ids: number[]
	vote_average?: number
	vote_count?: number
	popularity?: number
	adult?: boolean
	original_language?: string
}

export interface TMDBSearchResponse {
	page: number
	results: TMDBMediaItem[]
	total_pages: number
	total_results: number
}

export interface SearchOptions {
	page?: number
	language?: string
	includeAdult?: boolean
	region?: string
	year?: number
	primaryReleaseYear?: number
	firstAirDateYear?: number
}

@Injectable()
export class TMDBService {
	private readonly logger = new Logger(TMDBService.name)
	private readonly config: ReturnType<typeof getTMDBConfig>

	// In-memory caches for genre maps
	private movieGenreMap: Record<number, string> | null = null
	private tvGenreMap: Record<number, string> | null = null
	private lastMovieGenreFetchAt: number | null = null
	private lastTvGenreFetchAt: number | null = null

	constructor(
		private configService: ConfigService,
		private httpRetryService: HttpRetryService
	) {
		try {
			this.config = getTMDBConfig(this.configService)
			this.logger.log('TMDB Service initialized successfully')
		} catch (error) {
			this.logger.error(
				'Failed to initialize TMDB Service:',
				error.message
			)
			throw new HttpException(
				'TMDB configuration error',
				HttpStatus.INTERNAL_SERVER_ERROR
			)
		}
	}

	private async makeTMDBRequest(
		endpoint: string,
		params: Record<string, string | number | boolean> = {}
	): Promise<any> {
		const queryParams = new URLSearchParams({
			api_key: this.config.apiKey,
			...Object.fromEntries(
				Object.entries(params).map(([key, value]) => [
					key,
					String(value)
				])
			)
		})

		const url = `${this.config.baseUrl}${endpoint}?${queryParams}`

		try {
			return await this.httpRetryService.makeJsonRequest(
				url,
				{
					headers: {
						'User-Agent': 'TMDB-Client/1.0'
					}
				},
				{
					maxRetries: 3,
					timeout: 10000,
					baseDelay: 1000,
					exponentialBackoff: false
				}
			)
		} catch (error) {
			this.logger.error(
				`Failed to fetch from ${endpoint}: ${error.message}`
			)
			throw new HttpException(
				`TMDB request failed: ${error.message}`,
				HttpStatus.INTERNAL_SERVER_ERROR
			)
		}
	}

	private normalizeMovieItem(item: any): TMDBMediaItem {
		return {
			...item,
			media_type: 'movie' as const,
			title: item.title,
			name: undefined
		}
	}

	private normalizeTVItem(item: any): TMDBMediaItem {
		return {
			...item,
			media_type: 'tv' as const,
			name: item.name,
			title: undefined
		}
	}

	async searchMovies(
		query: string,
		options: SearchOptions = {}
	): Promise<TMDBSearchResponse> {
		if (!query?.trim()) {
			throw new HttpException(
				'Query parameter is required',
				HttpStatus.BAD_REQUEST
			)
		}

		try {
			const params = {
				query: query.trim(),
				page: options.page || 1,
				language: options.language || this.config.language,
				include_adult: options.includeAdult || false,
				...(options.region && { region: options.region }),
				...(options.primaryReleaseYear && {
					primary_release_year: options.primaryReleaseYear
				})
			}

			const data = await this.makeTMDBRequest('/search/movie', params)

			return {
				...data,
				results: data.results.map(this.normalizeMovieItem)
			}
		} catch (error) {
			this.logger.error(
				`Error searching movies for query "${query}": ${error.message}`
			)
			throw error
		}
	}

	async searchTVShows(
		query: string,
		options: SearchOptions = {}
	): Promise<TMDBSearchResponse> {
		if (!query?.trim()) {
			throw new HttpException(
				'Query parameter is required',
				HttpStatus.BAD_REQUEST
			)
		}

		try {
			const params = {
				query: query.trim(),
				page: options.page || 1,
				language: options.language || this.config.language,
				include_adult: options.includeAdult || false,
				...(options.firstAirDateYear && {
					first_air_date_year: options.firstAirDateYear
				})
			}

			const data = await this.makeTMDBRequest('/search/tv', params)

			return {
				...data,
				results: data.results.map(this.normalizeTVItem)
			}
		} catch (error) {
			this.logger.error(
				`Error searching TV shows for query "${query}": ${error.message}`
			)
			throw error
		}
	}

	async getMovieDetails(id: number, language?: string): Promise<any> {
		const params = {
			language: language || this.config.language
		}

		return this.makeTMDBRequest(`/movie/${id}`, params)
	}

	async getTVShowDetails(id: number, language?: string): Promise<any> {
		const params = {
			language: language || this.config.language
		}

		return this.makeTMDBRequest(`/tv/${id}`, params)
	}

	async getPopularMovies(
		page: number = 1,
		language?: string
	): Promise<TMDBSearchResponse> {
		const params = {
			page,
			language: language || this.config.language
		}

		const data = await this.makeTMDBRequest('/movie/popular', params)

		return {
			...data,
			results: data.results.map(this.normalizeMovieItem)
		}
	}

	async getPopularTVShows(
		page: number = 1,
		language?: string
	): Promise<TMDBSearchResponse> {
		const params = {
			page,
			language: language || this.config.language
		}

		const data = await this.makeTMDBRequest('/tv/popular', params)

		return {
			...data,
			results: data.results.map(this.normalizeTVItem)
		}
	}

	// Fetch and cache TMDB genres for the specified type (movie/tv)
	// Returns a map of genreId -> genreName in the configured language
	async getGenreMap(
		type: 'movie' | 'tv',
		options: { forceRefresh?: boolean } = {}
	): Promise<Record<number, string>> {
		const now = Date.now()
		const ttlMs = 24 * 60 * 60 * 1000 // 24h

		if (type === 'movie') {
			const isFresh =
				this.movieGenreMap &&
				this.lastMovieGenreFetchAt !== null &&
				now - this.lastMovieGenreFetchAt < ttlMs
			if (isFresh && !options.forceRefresh) {
				return this.movieGenreMap as Record<number, string>
			}
		} else {
			const isFresh =
				this.tvGenreMap &&
				this.lastTvGenreFetchAt !== null &&
				now - this.lastTvGenreFetchAt < ttlMs
			if (isFresh && !options.forceRefresh) {
				return this.tvGenreMap as Record<number, string>
			}
		}

		const endpoint =
			type === 'movie' ? '/genre/movie/list' : '/genre/tv/list'
		const data = await this.makeTMDBRequest(endpoint, {
			language: this.config.language
		})

		const map: Record<number, string> = {}
		for (const genre of data.genres || []) {
			if (
				genre &&
				typeof genre.id === 'number' &&
				typeof genre.name === 'string'
			) {
				map[genre.id] = genre.name
			}
		}

		if (type === 'movie') {
			this.movieGenreMap = map
			this.lastMovieGenreFetchAt = now
		} else {
			this.tvGenreMap = map
			this.lastTvGenreFetchAt = now
		}

		return map
	}

	// Map a list of TMDB genre IDs to their localized names using cached maps.
	// Synchronous and does not trigger network requests. Call getGenreMap() first to ensure cache.
	mapGenreIdsToNames(
		type: 'movie' | 'tv',
		ids?: number[]
	): string[] | undefined {
		const map = type === 'movie' ? this.movieGenreMap : this.tvGenreMap
		if (!map || !ids?.length) return undefined
		const names = ids.map(id => map[id]).filter(Boolean) as string[]
		return names.length ? names : undefined
	}
}
