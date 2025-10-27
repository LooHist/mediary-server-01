import { PrismaService } from '@database/prisma'
import { Injectable } from '@nestjs/common'

@Injectable()
export class UserLibraryGenresService {
	// Simple in-memory cache for genres
	private cachedAllGenres: string[] | null = null
	private cachedAllGenresAt: number | null = null
	private readonly genresCacheTtlMs = 6 * 60 * 60 * 1000 // 6 hours

	constructor(private readonly prisma: PrismaService) {}

	/**
	 * Get all unique genres from user's library
	 */
	async getGenres(userId: string): Promise<string[]> {
		const libraryItems = await this.prisma.userLibrary.findMany({
			where: { userId },
			include: {
				media: {
					select: {
						mediaData: true
					}
				}
			}
		})

		const allGenres = new Set<string>()

		libraryItems.forEach(item => {
			const mediaData = item.media.mediaData as any
			if (mediaData?.genres && Array.isArray(mediaData.genres)) {
				mediaData.genres.forEach((genre: string) => {
					if (genre && typeof genre === 'string') {
						allGenres.add(genre.trim())
					}
				})
			}
		})

		return Array.from(allGenres).sort()
	}

	/**
	 * Get all unique genres from all media in the system (cached)
	 */
	async getAllGenres(): Promise<string[]> {
		const now = Date.now()

		// Check cache validity
		if (
			this.cachedAllGenres &&
			this.cachedAllGenresAt &&
			now - this.cachedAllGenresAt < this.genresCacheTtlMs
		) {
			return this.cachedAllGenres
		}

		// Fetch fresh data
		const mediaItems = await this.prisma.media.findMany({
			select: {
				mediaData: true
			}
		})

		const allGenres = new Set<string>()

		mediaItems.forEach(item => {
			const mediaData = item.mediaData as any
			if (mediaData?.genres && Array.isArray(mediaData.genres)) {
				mediaData.genres.forEach((genre: string) => {
					if (genre && typeof genre === 'string') {
						allGenres.add(genre.trim())
					}
				})
			}
		})

		const sortedGenres = Array.from(allGenres).sort()

		// Update cache
		this.cachedAllGenres = sortedGenres
		this.cachedAllGenresAt = now

		return sortedGenres
	}

	/**
	 * Clear genres cache (useful for testing or manual cache invalidation)
	 */
	clearCache(): void {
		this.cachedAllGenres = null
		this.cachedAllGenresAt = null
	}
}
