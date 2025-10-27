import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import fetch from 'node-fetch'

@Injectable()
export class ImageService {
	private readonly logger = new Logger(ImageService.name)

	constructor(private configService: ConfigService) {}

	/**
	 * Проксування зображень з зовнішніх джерел
	 */
	async proxyImage(
		url: string,
		options?: { width?: number; height?: number }
	): Promise<Buffer> {
		try {
			const response = await fetch(url)

			if (!response.ok) {
				throw new Error(
					`HTTP ${response.status}: ${response.statusText}`
				)
			}

			const buffer = await response.buffer()
			return buffer
		} catch (error) {
			this.logger.error('Помилка проксування зображення:', error)
			throw new Error(`Помилка завантаження зображення: ${error.message}`)
		}
	}

	/**
	 * Обробка TMDB зображень
	 */
	async processTMDBImage(
		posterPath: string,
		size:
			| 'w92'
			| 'w154'
			| 'w185'
			| 'w342'
			| 'w500'
			| 'w780'
			| 'original' = 'w342'
	): Promise<string> {
		if (!posterPath) {
			return null
		}

		const tmdbBaseUrl = 'https://image.tmdb.org/t/p/'
		const fullUrl = `${tmdbBaseUrl}${size}${posterPath}`

		return fullUrl
	}

	/**
	 * Завантаження зображення на Cloudinary
	 */
	async uploadToCloudinary(file: {
		path: string
		originalname: string
	}): Promise<string> {
		try {
			// Тут буде логіка завантаження на Cloudinary
			// Поки що повертаємо заглушку
			this.logger.log('Завантаження на Cloudinary:', file.originalname)
			return `https://cloudinary.com/example/${file.originalname}`
		} catch (error) {
			this.logger.error('Помилка завантаження на Cloudinary:', error)
			throw new Error(`Помилка завантаження: ${error.message}`)
		}
	}

	/**
	 * Отримання статистики зображень
	 */
	async getImageStats(): Promise<{
		totalImages: number
		cachedImages: number
	}> {
		return {
			totalImages: 0,
			cachedImages: 0
		}
	}

	/**
	 * Очищення старих зображень
	 */
	async cleanupOldImages(days: number = 30): Promise<void> {
		this.logger.log(`Очищення зображень старіших за ${days} днів`)
		// Логіка очищення
	}
}
