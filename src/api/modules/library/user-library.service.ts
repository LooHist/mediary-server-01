import { PrismaService } from '@database/prisma'
import { Injectable } from '@nestjs/common'
import { UserLibrary } from '@prisma/client'

import { AddFromSearchDto, GetLibraryDto, UpdateLibraryItemDto } from './dto'
import { UserLibraryFilteringService } from './filtering'
import { UserLibraryGenresService } from './genres'
import { UserLibraryItemsService } from './library-items'
import { UserLibraryRecommendationsService } from './recommendations'
import { UserLibrarySortingService } from './sorting'

@Injectable()
export class UserLibraryService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly sortingService: UserLibrarySortingService,
		private readonly genresService: UserLibraryGenresService,
		private readonly itemsService: UserLibraryItemsService,
		private readonly recommendationsService: UserLibraryRecommendationsService,
		private readonly filteringService: UserLibraryFilteringService
	) {}

	/* Add media from search to library (creates media + adds to library) */
	async addFromSearch(
		userId: string,
		addFromSearchDto: AddFromSearchDto
	): Promise<UserLibrary> {
		return this.itemsService.addFromSearch(userId, addFromSearchDto)
	}

	/* Update library item */
	async updateLibraryItem(
		userId: string,
		mediaId: string,
		updateDto: UpdateLibraryItemDto
	): Promise<UserLibrary> {
		return this.itemsService.updateLibraryItem(userId, mediaId, updateDto)
	}

	/* Delete from library */
	async removeFromLibrary(userId: string, mediaId: string): Promise<void> {
		return this.itemsService.removeFromLibrary(userId, mediaId)
	}

	/* Get user library with filtering */
	async getUserLibrary(userId: string, getLibraryDto: GetLibraryDto) {
		const {
			page = 1,
			limit = 20,
			sortBy = 'addedAt',
			sortOrder = 'desc'
		} = getLibraryDto

		const skip = (page - 1) * limit

		// Build filtering conditions using the filtering service
		const where = this.filteringService.buildWhereConditions(
			userId,
			getLibraryDto
		)

		// Handle special sorting cases
		if (sortBy === 'favorites') {
			return this.sortingService.sortByFavorites(
				where,
				userId,
				page,
				limit
			)
		}

		if (sortBy === 'releaseYear') {
			return this.sortingService.sortByReleaseYear(
				where,
				userId,
				page,
				limit,
				sortOrder
			)
		}

		// Use standard sorting for other cases
		const orderBy = this.sortingService.getStandardOrderBy(
			sortBy,
			sortOrder
		)

		// Execute parallel queries
		const [libraryItems, total] = await Promise.all([
			this.prisma.userLibrary.findMany({
				where,
				skip,
				take: limit,
				orderBy,
				include: this.filteringService.getStandardInclude(userId)
			}),
			this.prisma.userLibrary.count({ where })
		])

		return {
			data: libraryItems,
			meta: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
				hasNextPage: page < Math.ceil(total / limit),
				hasPrevPage: page > 1
			}
		}
	}

	/* Check if media is in user's library */
	async isInLibrary(userId: string, mediaId: string): Promise<boolean> {
		return this.itemsService.isInLibrary(userId, mediaId)
	}

	/* Get specific item from library */
	async getLibraryItem(
		userId: string,
		mediaId: string
	): Promise<UserLibrary | null> {
		return this.itemsService.getLibraryItem(userId, mediaId)
	}

	/* Get recommendations based on user's library */
	async getRecommendations(userId: string, limit: number = 10) {
		// TODO: Expand recommendation algorithm for different media types
		// For now, simple algorithm based on favorite movies/TV shows

		// Find favorite media of user (high rating)
		const favoriteItems = await this.prisma.userLibrary.findMany({
			where: {
				userId,
				rating: { gte: 7 } // High rating
			},
			include: {
				media: {
					include: {
						collection: true
					}
				}
			}
		})

		if (favoriteItems.length === 0) {
			return { data: [], message: 'Not enough data for recommendations' }
		}

		// Get popular collections from favorite media
		const collectionIds = favoriteItems.map(item => item.media.collectionId)
		const uniqueCollectionIds = [...new Set(collectionIds)]

		// Find media that user hasn't added to library
		const recommendations = await this.prisma.media.findMany({
			where: {
				collectionId: { in: uniqueCollectionIds },
				library: {
					none: { userId } // Media that user hasn't added to library
				}
			},
			include: {
				collection: true,
				_count: {
					select: {
						library: true,
						reviews: true
					}
				}
			},
			take: limit,
			orderBy: {
				library: { _count: 'desc' } // Popular media
			}
		})

		return { data: recommendations }
	}

	/* Get all unique genres from user's library */
	async getGenres(userId: string): Promise<string[]> {
		return this.genresService.getGenres(userId)
	}

	/* Get all unique genres from all media with simple in-memory caching (additional method, not yet used) */
	async getAllGenres(): Promise<string[]> {
		return this.genresService.getAllGenres()
	}
}
