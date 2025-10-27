import { PrismaService } from '@database/prisma'
import { Injectable } from '@nestjs/common'
import type { UserLibrary } from '@prisma/client'

@Injectable()
export class UserLibraryRecommendationsService {
	constructor(private readonly prisma: PrismaService) {}

	/**
	 * Get recommendations based on user's library
	 */
	async getRecommendations(
		userId: string,
		limit: number = 10
	): Promise<UserLibrary[]> {
		// Get user's favorite genres
		const userLibrary = await this.prisma.userLibrary.findMany({
			where: { userId },
			include: {
				media: {
					select: {
						mediaData: true,
						categoryId: true
					}
				}
			}
		})

		// Extract genres from user's library
		const userGenres = new Set<string>()
		const userCategories = new Set<string>()

		userLibrary.forEach(item => {
			const mediaData = item.media.mediaData as any
			if (mediaData?.genres && Array.isArray(mediaData.genres)) {
				mediaData.genres.forEach((genre: string) => {
					if (genre && typeof genre === 'string') {
						userGenres.add(genre.trim())
					}
				})
			}
			userCategories.add(item.media.categoryId)
		})

		// Find media that user doesn't have but matches their preferences
		const recommendations = await this.prisma.media.findMany({
			where: {
				AND: [
					{
						// Not in user's library
						library: {
							none: {
								userId
							}
						}
					},
					{
						// Matches user's categories
						categoryId: {
							in: Array.from(userCategories)
						}
					},
					{
						// Has genres that user likes
						OR: Array.from(userGenres).map(genre => ({
							mediaData: {
								path: ['genres'],
								array_contains: genre
							}
						}))
					}
				]
			},
			include: {
				category: true,
				_count: {
					select: {
						library: true,
						reviews: true,
						favorites: true
					}
				}
			},
			take: limit
		})

		// Convert to UserLibrary format for consistency
		return recommendations.map(media => ({
			id: `rec_${media.id}`,
			userId,
			mediaId: media.id,
			status: 'PLANNED' as any,
			rating: null,
			notes: null,
			addedAt: new Date(),
			updatedAt: new Date(),
			media: {
				...media,
				favorites: []
			}
		})) as UserLibrary[]
	}
}
