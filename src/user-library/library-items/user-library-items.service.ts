import {
	ConflictException,
	Injectable,
	NotFoundException
} from '@nestjs/common'
import { MediaSource, Prisma, UserLibrary } from '@prisma/client'

import { normalizeTitle } from '../../libs/common/utils/normalize-title.util'
import { sanitizePlainText } from '../../libs/common/utils/sanitize-text.util'
import { PrismaService } from '../../prisma/prisma.service'
import { UserCategoriesService } from '../../user-categories/user-categories.service'
import { AddFromSearchDto, UpdateLibraryItemDto } from '../dto'

@Injectable()
export class UserLibraryItemsService {
	/* Fixed category mapping */
	private readonly categoryMap = {
		movie: 'Movies',
		tv_show: 'Series',
		book: 'Books',
		anime: 'Anime',
		game: 'Games',
		drama: 'Dramas',
		manga: 'Manga',
		manhwa: 'Manhwa'
	} as const

	constructor(
		private readonly prisma: PrismaService,
		private readonly userCategoriesService: UserCategoriesService
	) {}

	/**
	 * Add media from search to library (creates media + adds to library)
	 */
	async addFromSearch(
		userId: string,
		addFromSearchDto: AddFromSearchDto
	): Promise<UserLibrary> {
		const { searchResult, status, rating, notes } = addFromSearchDto

		let createdNewMedia = false

		// Determine category based on media type
		const categoryName =
			this.categoryMap[
				searchResult.type as keyof typeof this.categoryMap
			] || 'Movies'

		// Find existing category (categories are pre-seeded)
		let category = await this.prisma.category.findUnique({
			where: { name: categoryName }
		})

		if (!category) {
			// This should rarely happen as categories are pre-seeded
			category = await this.prisma.category.create({
				data: { name: categoryName }
			})
		}

		// Ensure category is added to user's personal categories
		try {
			await this.userCategoriesService.addCategoryToUser(
				userId,
				category.id
			)
		} catch (error) {
			// Category might already be added, which is fine
			if (!error.message.includes('already added')) {
				throw error
			}
		}

		// Check if media already exists
		let media = await this.prisma.media.findFirst({
			where: {
				// Only check by external ID (most reliable)
				source: MediaSource.TMDB,
				externalId: searchResult.id?.toString()
			}
		})

		// Create media if it doesn't exist
		if (!media) {
			media = await this.prisma.media.create({
				data: {
					source: MediaSource.TMDB,
					externalId: searchResult.id?.toString(),
					searchableTitle: normalizeTitle(searchResult.title),
					mediaData: {
						title: searchResult.title,
						originalTitle: searchResult.title,
						description: searchResult.subtitle || '',
						year: searchResult.year,
						posterUrl: searchResult.imageUrl,
						genres: searchResult.genres || [],
						rating: searchResult.rating
					},
					categoryId: category.id,
					addedById: userId
				}
			})
			createdNewMedia = true
		}

		// Check if already in library
		const existingLibraryItem = await this.prisma.userLibrary.findUnique({
			where: {
				userId_mediaId: {
					userId,
					mediaId: media.id
				}
			}
		})

		if (existingLibraryItem) {
			throw new ConflictException('Media already in your library')
		}

		// Add to library
		const libraryItem = await this.prisma.userLibrary.create({
			data: {
				userId,
				mediaId: media.id,
				status: status as any,
				rating: rating || null,
				notes: notes ? sanitizePlainText(notes) : null
			},
			include: {
				media: {
					include: {
						category: true,
						_count: {
							select: {
								library: true,
								reviews: true,
								favorites: true
							}
						}
					}
				}
			}
		})

		return libraryItem
	}

	/**
	 * Update library item
	 */
	async updateLibraryItem(
		userId: string,
		mediaId: string,
		updateDto: UpdateLibraryItemDto
	): Promise<UserLibrary> {
		const { status, rating, notes } = updateDto

		const existingItem = await this.prisma.userLibrary.findUnique({
			where: {
				userId_mediaId: {
					userId,
					mediaId
				}
			}
		})

		if (!existingItem) {
			throw new NotFoundException('Media not found in your library')
		}

		// Prepare update data
		const updateData: any = {}

		// Add status if provided
		if (status !== undefined) {
			updateData.status = status
		}

		// Add rating if provided
		if (rating !== undefined) {
			updateData.rating = rating
		}

		// Add notes if provided
		if (notes !== undefined) {
			updateData.notes = sanitizePlainText(notes)
		}

		// If status is being changed to non-COMPLETED, clear rating and notes
		if (status !== undefined && status !== 'COMPLETED') {
			updateData.rating = null
			updateData.notes = null
		}

		// Update library item
		const updatedItem = await this.prisma.userLibrary.update({
			where: {
				userId_mediaId: {
					userId,
					mediaId
				}
			},
			data: updateData,
			include: {
				media: {
					include: {
						category: true,
						_count: {
							select: {
								library: true,
								reviews: true
							}
						}
					}
				}
			}
		})

		return updatedItem
	}

	/**
	 * Remove media from library
	 */
	async removeFromLibrary(userId: string, mediaId: string): Promise<void> {
		const existingItem = await this.prisma.userLibrary.findUnique({
			where: {
				userId_mediaId: {
					userId,
					mediaId
				}
			}
		})

		if (!existingItem) {
			throw new NotFoundException('Media not found in your library')
		}

		// Use transaction to ensure both operations succeed or fail together
		await this.prisma.$transaction(async tx => {
			// Remove from library
			await tx.userLibrary.delete({
				where: {
					userId_mediaId: {
						userId,
						mediaId
					}
				}
			})

			// Also remove from favorites if it exists
			await tx.userFavorite.deleteMany({
				where: {
					userId,
					mediaId
				}
			})
		})
	}

	/**
	 * Check if media is in user's library
	 */
	async isInLibrary(userId: string, mediaId: string): Promise<boolean> {
		const item = await this.prisma.userLibrary.findUnique({
			where: {
				userId_mediaId: {
					userId,
					mediaId
				}
			}
		})

		return !!item
	}

	/**
	 * Get specific item from library
	 */
	async getLibraryItem(
		userId: string,
		mediaId: string
	): Promise<UserLibrary | null> {
		return this.prisma.userLibrary.findUnique({
			where: {
				userId_mediaId: {
					userId,
					mediaId
				}
			},
			include: {
				media: {
					include: {
						category: true,
						_count: {
							select: {
								library: true,
								reviews: true
							}
						}
					}
				}
			}
		})
	}
}
