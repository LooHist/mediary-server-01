import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { readFile, unlink } from 'fs/promises'
import fetch from 'node-fetch'

@Injectable()
export class ImageService {
	private readonly logger = new Logger(ImageService.name)
	private readonly s3Client: S3Client | null
	private readonly bucketName: string
	private readonly publicUrl: string

	constructor(private configService: ConfigService) {
		// Initialize S3 client for Cloudflare R2
		const accountId = this.configService.get<string>('R2_ACCOUNT_ID')
		const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID')
		const secretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY')
		this.bucketName = this.configService.get<string>('R2_BUCKET_NAME') || ''
		this.publicUrl = this.configService.get<string>('R2_PUBLIC_URL') || ''

		if (!accountId || !accessKeyId || !secretAccessKey || !this.bucketName) {
			this.logger.warn(
				'Cloudflare R2 credentials not configured. Image upload will not work.'
			)
		} else {
			// Cloudflare R2 uses S3-compatible API
			// Endpoint should be in format: https://<account-id>.r2.cloudflarestorage.com
			this.s3Client = new S3Client({
				region: 'auto',
				endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
				credentials: {
					accessKeyId,
					secretAccessKey
				}
			})
		}
	}

	/** Proxy images from external sources **/
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
			this.logger.error('Error proxying image:', error)
			throw new Error(`Error loading image: ${error.message}`)
		}
	}

	/** Process TMDB images **/
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

	/** Upload image to Cloudflare R2 **/
	async uploadToR2(file: {
		path: string
		originalname: string
		mimetype?: string
	}): Promise<string> {
		if (!this.s3Client) {
			throw new Error('Cloudflare R2 is not configured')
		}

		try {
			// Read file from disk
			const fileBuffer = await readFile(file.path)

			// Generate unique file name
			const timestamp = Date.now()
			const randomString = Math.round(Math.random() * 1e9).toString(36)
			const extension = file.originalname.split('.').pop() || 'jpg'
			const fileName = `uploads/${timestamp}-${randomString}.${extension}`

			// Determine Content-Type
			const contentType = file.mimetype || this.getContentTypeFromExtension(extension)

			// Upload to R2
			// Note: Cloudflare R2 does not support ACL via API
			// Public access is configured in Dashboard (R2 → Bucket → Settings → Public Access)
			const command = new PutObjectCommand({
				Bucket: this.bucketName,
				Key: fileName,
				Body: fileBuffer,
				ContentType: contentType
			})

			await this.s3Client.send(command)

			// Delete temporary file from disk
			try {
				await unlink(file.path)
			} catch (error) {
				this.logger.warn(`Failed to delete temporary file: ${file.path}`, error)
			}

			// Form public URL
			// If R2_PUBLIC_URL is specified, use it
			// Otherwise, form URL with account-id
			const publicUrl = this.publicUrl
				? `${this.publicUrl.replace(/\/$/, '')}/${fileName}`
				: `https://pub-${this.configService.get<string>('R2_ACCOUNT_ID')}.r2.dev/${fileName}`

			this.logger.log(`Image uploaded to R2: ${fileName}`)

			return publicUrl
		} catch (error) {
			this.logger.error('Error uploading to Cloudflare R2:', error)
			throw new Error(`Upload error: ${error.message}`)
		}
	}

	/** Delete image from Cloudflare R2 **/
	async deleteFromR2(fileName: string): Promise<void> {
		if (!this.s3Client) {
			throw new Error('Cloudflare R2 is not configured')
		}

		try {
			// Remove publicUrl prefix if present
			let key = fileName
			if (this.publicUrl && fileName.includes(this.publicUrl)) {
				key = fileName.replace(this.publicUrl.replace(/\/$/, '') + '/', '')
			}

			const command = new DeleteObjectCommand({
				Bucket: this.bucketName,
				Key: key
			})

			await this.s3Client.send(command)
			this.logger.log(`Image deleted from R2: ${key}`)
		} catch (error) {
			this.logger.error('Error deleting from Cloudflare R2:', error)
			throw new Error(`Delete error: ${error.message}`)
		}
	}

	/** Get image statistics **/
	async getImageStats(): Promise<{
		totalImages: number
		cachedImages: number
	}> {
		return {
			totalImages: 0,
			cachedImages: 0
		}
	}

	/** Cleanup old images **/
	async cleanupOldImages(days: number = 30): Promise<void> {
		this.logger.log(`Cleaning up images older than ${days} days`)
		// TODO: Implement cleanup of old images from R2
		// Can use ListObjectsV2Command to get list of files
		// and check creation date
	}

	/** Determine Content-Type from file extension **/
	private getContentTypeFromExtension(extension: string): string {
		const ext = extension.toLowerCase()
		const contentTypes: Record<string, string> = {
			jpg: 'image/jpeg',
			jpeg: 'image/jpeg',
			png: 'image/png',
			webp: 'image/webp'
		}

		return contentTypes[ext] || 'image/jpeg'
	}
}
