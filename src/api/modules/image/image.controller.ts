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

	/** Proxy images from TMDB and other sources **/
	@Get('proxy')
	async proxyImage(
		@Res() res: Response,
		@Query('url') url: string,
		@Query('w') width?: string,
		@Query('h') height?: string
	) {
		if (!url) {
			throw new BadRequestException('Image URL is required')
		}

		try {
			const options = {
				...(width && { width: parseInt(width, 10) }),
				...(height && { height: parseInt(height, 10) })
			}

			const imageBuffer = await this.imageService.proxyImage(url, options)

			// Determine content type
			const contentType = this.getContentType(url)

			res.set({
				'Content-Type': contentType,
				'Cache-Control': 'public, max-age=31536000', // 1 year
				'Content-Length': imageBuffer.length.toString()
			})

			res.send(imageBuffer)
		} catch (error) {
			throw new BadRequestException(
				`Error proxying image: ${error.message}`
			)
		}
	}

	/** Get URL for TMDB poster **/
	@Get('tmdb-poster')
	async getTMDBPosterUrl(
		@Query('path') posterPath: string,
		@Query('size')
		size?: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original'
	) {
		if (!posterPath) {
			throw new BadRequestException('Poster path is required')
		}

		const imageUrl = await this.imageService.processTMDBImage(
			posterPath,
			size || 'w342'
		)

		return { url: imageUrl }
	}

	/** Upload user image **/
	@Post('upload')
	@UseInterceptors(FileInterceptor('image'))
	async uploadImage(@UploadedFile() file: any) {
		if (!file) {
			throw new BadRequestException('Image file is required')
		}

		// Check file type
		const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
		if (!allowedTypes.includes(file.mimetype)) {
			throw new BadRequestException(
				'Only JPEG, PNG and WebP files are supported'
			)
		}

		// Check file size (max 4MB)
		const maxSize = 4 * 1024 * 1024
		if (file.size > maxSize) {
			throw new BadRequestException(
				'File size must not exceed 4MB'
			)
		}

		try {
			const r2Url = await this.imageService.uploadToR2({
				path: file.path,
				originalname: file.originalname,
				mimetype: file.mimetype
			})

			return {
				url: r2Url,
				originalName: file.originalname,
				size: file.size
			}
		} catch (error) {
			throw new BadRequestException(
				`Upload error: ${error.message}`
			)
		}
	}

	/** Image statistics **/
	@Get('stats')
	async getImageStats() {
		return this.imageService.getImageStats()
	}

	/** Cleanup old images (admin endpoint) **/
	@Post('cleanup')
	async cleanupImages(@Query('days') days?: string) {
		const daysToKeep = days ? parseInt(days, 10) : 30

		await this.imageService.cleanupOldImages(daysToKeep)

		return {
			message: `Cleaned up images older than ${daysToKeep} days`
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
			default:
				return 'image/jpeg'
		}
	}
}
