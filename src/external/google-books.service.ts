import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { getGoogleBooksConfig } from '../config/google-books.config'

import { HttpRetryService } from './utils/http-retry.service'

export interface GoogleBooksMediaItem {
	id: string
	title: string
	authors?: string[]
	description?: string
	publishedDate?: string
	imageLinks?: {
		thumbnail?: string
		smallThumbnail?: string
	}
	industryIdentifiers?: Array<{
		type: string
		identifier: string
	}>
	pageCount?: number
	categories?: string[]
	language?: string
	averageRating?: number
}

export interface GoogleBooksSearchResponse {
	items: GoogleBooksMediaItem[]
	totalItems: number
}

@Injectable()
export class GoogleBooksService {
	private readonly logger = new Logger(GoogleBooksService.name)
	private readonly config: ReturnType<typeof getGoogleBooksConfig>

	constructor(
		private configService: ConfigService,
		private httpRetryService: HttpRetryService
	) {
		try {
			this.config = getGoogleBooksConfig(this.configService)
			this.logger.log('Google Books Service initialized successfully')
		} catch (error) {
			this.logger.error(
				'Failed to initialize Google Books Service:',
				error.message
			)
			throw new HttpException(
				'Google Books configuration error',
				HttpStatus.INTERNAL_SERVER_ERROR
			)
		}
	}

	private async makeGoogleBooksRequest(
		endpoint: string,
		params: Record<string, string | number> = {}
	): Promise<GoogleBooksSearchResponse> {
		const queryParams = new URLSearchParams({
			key: this.config.apiKey,
			langRestrict: this.config.langRestrict,
			printType: this.config.printType,
			...Object.fromEntries(
				Object.entries(params).map(([key, value]) => [
					key,
					String(value)
				])
			)
		})

		const url = `${this.config.baseUrl}${endpoint}?${queryParams}`

		try {
			this.logger.debug(`Making Google Books request: ${endpoint}`)

			const data = await this.httpRetryService.makeJsonRequest(url)

			this.logger.debug(`Successfully fetched Google Books data`)
			return {
				items: data.items || [],
				totalItems: data.totalItems || 0
			}
		} catch (error) {
			const message = `Google Books request failed: ${error.message}`
			this.logger.error(message)
			throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR)
		}
	}

	async searchBooks(
		query: string,
		startIndex: number = 0,
		maxResults: number = 40
	): Promise<GoogleBooksSearchResponse> {
		return this.makeGoogleBooksRequest('/volumes', {
			q: query,
			startIndex,
			maxResults
		})
	}

	async searchBooksByTitle(
		query: string,
		startIndex: number = 0,
		maxResults: number = 40
	): Promise<GoogleBooksSearchResponse> {
		return this.makeGoogleBooksRequest('/volumes', {
			q: `intitle:${query}`,
			startIndex,
			maxResults
		})
	}
}
