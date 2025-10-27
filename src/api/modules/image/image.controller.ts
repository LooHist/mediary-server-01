import {
	BadRequestException,
	Controller,
	Get,
	Post,
	Query,
	Res,
	UploadedFile,
	UseInterceptors
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { Response } from 'express'

import { ImageService } from './image.service'

@Controller('image')
export class ImageController {
	constructor(private readonly imageService: ImageService) {}

	/**
	 * Проксування зображень з TMDB та інших джерел
	 */
	@Get('proxy')
	async proxyImage(
		@Res() res: Response,
		@Query('url') url: string,
		@Query('w') width?: string,
		@Query('h') height?: string
	) {
		if (!url) {
			throw new BadRequestException("URL зображення обов'язковий")
		}

		try {
			const options = {
				...(width && { width: parseInt(width, 10) }),
				...(height && { height: parseInt(height, 10) })
			}

			const imageBuffer = await this.imageService.proxyImage(url, options)

			// Визначаємо тип контенту
			const contentType = this.getContentType(url)

			res.set({
				'Content-Type': contentType,
				'Cache-Control': 'public, max-age=31536000', // 1 рік
				'Content-Length': imageBuffer.length.toString()
			})

			res.send(imageBuffer)
		} catch (error) {
			throw new BadRequestException(
				`Помилка проксування зображення: ${error.message}`
			)
		}
	}

	/**
	 * Отримання URL для TMDB постера
	 */
	@Get('tmdb-poster')
	async getTMDBPosterUrl(
		@Query('path') posterPath: string,
		@Query('size')
		size?: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original'
	) {
		if (!posterPath) {
			throw new BadRequestException("Шлях до постера обов'язковий")
		}

		const imageUrl = await this.imageService.processTMDBImage(
			posterPath,
			size || 'w342'
		)

		return { url: imageUrl }
	}

	/**
	 * Завантаження користувацького зображення
	 */
	@Post('upload')
	@UseInterceptors(FileInterceptor('image'))
	async uploadImage(@UploadedFile() file: any) {
		if (!file) {
			throw new BadRequestException("Файл зображення обов'язковий")
		}

		// Перевіряємо тип файлу
		const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
		if (!allowedTypes.includes(file.mimetype)) {
			throw new BadRequestException(
				'Підтримуються лише JPEG, PNG та WebP файли'
			)
		}

		// Перевіряємо розмір (макс 5MB)
		const maxSize = 5 * 1024 * 1024
		if (file.size > maxSize) {
			throw new BadRequestException(
				'Розмір файлу не повинен перевищувати 5MB'
			)
		}

		try {
			const cloudinaryUrl = await this.imageService.uploadToCloudinary({
				path: file.path,
				originalname: file.originalname
			})

			return {
				url: cloudinaryUrl,
				originalName: file.originalname,
				size: file.size
			}
		} catch (error) {
			throw new BadRequestException(
				`Помилка завантаження: ${error.message}`
			)
		}
	}

	/**
	 * Статистика зображень
	 */
	@Get('stats')
	async getImageStats() {
		return this.imageService.getImageStats()
	}

	/**
	 * Очищення старих зображень (адмін ендпоінт)
	 */
	@Post('cleanup')
	async cleanupImages(@Query('days') days?: string) {
		const daysToKeep = days ? parseInt(days, 10) : 30

		await this.imageService.cleanupOldImages(daysToKeep)

		return {
			message: `Очищено зображення старші за ${daysToKeep} днів`
		}
	}

	private getContentType(url: string): string {
		const extension = url.split('.').pop()?.toLowerCase()

		switch (extension) {
			case 'jpg':
			case 'jpeg':
				return 'image/jpeg'
			case 'png':
				return 'image/png'
			case 'webp':
				return 'image/webp'
			case 'gif':
				return 'image/gif'
			default:
				return 'image/jpeg'
		}
	}
}
