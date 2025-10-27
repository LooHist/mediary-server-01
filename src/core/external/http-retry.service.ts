import { Injectable, Logger } from '@nestjs/common'

export interface RetryConfig {
	maxRetries?: number
	baseDelay?: number
	timeout?: number
	retryableStatuses?: number[]
	exponentialBackoff?: boolean
}

export interface RequestOptions extends RequestInit {
	timeout?: number
}

@Injectable()
export class HttpRetryService {
	private readonly logger = new Logger(HttpRetryService.name)

	private readonly defaultConfig: Required<RetryConfig> = {
		maxRetries: 3,
		baseDelay: 1000,
		timeout: 10000,
		retryableStatuses: [429, 500, 502, 503, 504],
		exponentialBackoff: true
	}

	/** Execute HTTP request with retry logic **/
	async executeWithRetry(
		url: string,
		options: RequestOptions = {},
		retryConfig: RetryConfig = {}
	): Promise<Response> {
		const config = { ...this.defaultConfig, ...retryConfig }
		const { timeout, ...fetchOptions } = options

		for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
			try {
				const controller = new AbortController()
				const timeoutId = setTimeout(
					() => controller.abort(),
					timeout || config.timeout
				)

				const response = await fetch(url, {
					...fetchOptions,
					signal: controller.signal
				})

				clearTimeout(timeoutId)

				// Successful request
				if (response.ok) {
					if (attempt > 1) {
						this.logger.log(
							`Request succeeded on attempt ${attempt}`
						)
					}
					return response
				}

				// Check if we should retry
				if (
					this.shouldRetry(response.status, config.retryableStatuses)
				) {
					if (attempt === config.maxRetries) {
						throw new Error(
							`Request failed after ${config.maxRetries} attempts. Status: ${response.status}`
						)
					}

					const delay = this.calculateDelay(attempt, config)
					this.logger.warn(
						`Request failed with status ${response.status}, retrying in ${delay}ms... (attempt ${attempt}/${config.maxRetries})`
					)
					await this.delay(delay)
					continue
				}

				// Errors that should not be retried
				return response // Return response for further processing
			} catch (error) {
				if (error.name === 'AbortError') {
					this.logger.error(
						`Request timeout on attempt ${attempt}/${config.maxRetries}`
					)
				} else {
					this.logger.error(
						`Network error on attempt ${attempt}/${config.maxRetries}: ${error.message}`
					)
				}

				if (attempt === config.maxRetries) {
					throw error
				}

				const delay = this.calculateDelay(attempt, config)
				this.logger.warn(`Retrying in ${delay}ms...`)
				await this.delay(delay)
			}
		}

		throw new Error('Unexpected error in retry logic')
	}

	/** Execute JSON request with automatic parsing **/
	async makeJsonRequest<T = any>(
		url: string,
		options: RequestOptions = {},
		retryConfig: RetryConfig = {}
	): Promise<T> {
		const response = await this.executeWithRetry(
			url,
			{
				...options,
				headers: {
					Accept: 'application/json',
					...options.headers
				}
			},
			retryConfig
		)

		if (!response.ok) {
			const errorText = await response.text().catch(() => 'Unknown error')
			throw new Error(`HTTP ${response.status}: ${errorText}`)
		}

		return response.json()
	}

	private shouldRetry(status: number, retryableStatuses: number[]): boolean {
		return retryableStatuses.includes(status)
	}

	private calculateDelay(
		attempt: number,
		config: Required<RetryConfig>
	): number {
		if (config.exponentialBackoff) {
			return Math.pow(2, attempt) * config.baseDelay
		}
		return config.baseDelay * attempt
	}

	private delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms))
	}
}
