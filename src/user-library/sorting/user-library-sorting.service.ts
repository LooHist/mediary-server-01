import { Injectable } from '@nestjs/common'
import type { Prisma, UserLibrary } from '@prisma/client'

import { PrismaService } from '../../prisma/prisma.service'

export interface SortingResult {
	data: UserLibrary[]
	meta: {
		page: number
		limit: number
		total: number
		totalPages: number
		hasNextPage: boolean
		hasPrevPage: boolean
	}
}

@Injectable()
export class UserLibrarySortingService {
	constructor(private readonly prisma: PrismaService) {}

	/**
	 * Sort library items by favorites
	 */
	async sortByFavorites(
		where: Prisma.UserLibraryWhereInput,
		userId: string,
		page: number,
		limit: number
	): Promise<SortingResult> {
		const skip = (page - 1) * limit

		const [libraryItems, total] = await Promise.all([
			this.prisma.userLibrary.findMany({
				where,
				include: {
					media: {
						include: {
							category: true,
							favorites: {
								where: { userId },
								select: { id: true }
							},
							_count: {
								select: {
									library: true,
									reviews: true
								}
							}
						}
					}
				}
			}),
			this.prisma.userLibrary.count({ where })
		])

		// Sort by favorites status manually
		const sortedItems = libraryItems.sort((a, b) => {
			const aIsFavorite =
				a.media.favorites && a.media.favorites.length > 0
			const bIsFavorite =
				b.media.favorites && b.media.favorites.length > 0

			// If both are favorites or both are not favorites, maintain original order
			if (aIsFavorite === bIsFavorite) return 0

			// Put favorites first
			return aIsFavorite ? -1 : 1
		})

		// Apply pagination manually
		const paginatedItems = sortedItems.slice(skip, skip + limit)

		return {
			data: paginatedItems,
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

	/**
	 * Sort library items by release year
	 */
	async sortByReleaseYear(
		where: Prisma.UserLibraryWhereInput,
		userId: string,
		page: number,
		limit: number,
		sortOrder: 'asc' | 'desc'
	): Promise<SortingResult> {
		const skip = (page - 1) * limit

		const [libraryItems, total] = await Promise.all([
			this.prisma.userLibrary.findMany({
				where,
				include: {
					media: {
						include: {
							category: true,
							favorites: {
								where: { userId },
								select: { id: true }
							},
							_count: {
								select: {
									library: true,
									reviews: true
								}
							}
						}
					}
				}
			}),
			this.prisma.userLibrary.count({ where })
		])

		// Sort by release year manually
		const sortedItems = libraryItems.sort((a, b) => {
			const aYear = (a.media.mediaData as any)?.year || 0
			const bYear = (b.media.mediaData as any)?.year || 0

			if (sortOrder === 'desc') {
				return bYear - aYear
			} else {
				return aYear - bYear
			}
		})

		// Apply pagination manually
		const paginatedItems = sortedItems.slice(skip, skip + limit)

		return {
			data: paginatedItems,
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

	/**
	 * Get standard Prisma orderBy for simple sorting
	 */
	getStandardOrderBy(
		sortBy: string,
		sortOrder: 'asc' | 'desc'
	): Prisma.UserLibraryOrderByWithRelationInput {
		switch (sortBy) {
			case 'title':
				return { media: { searchableTitle: sortOrder } }
			case 'addedAt':
				return { addedAt: sortOrder }
			case 'rating':
				// Put rated items first, unrated (NULL) last
				return { rating: { sort: sortOrder, nulls: 'last' } as any }
			default:
				return { [sortBy]: sortOrder } as any
		}
	}
}
