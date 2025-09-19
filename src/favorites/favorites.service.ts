import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'

import { PrismaService } from '../prisma/prisma.service'

import { FindFavoritesDto } from './dto'

@Injectable()
export class FavoritesService {
	constructor(private readonly prisma: PrismaService) {}

	async getUserFavorites(userId: string, findFavoritesDto: FindFavoritesDto) {
		const {
			search,
			categoryId,
			page = 1,
			limit = 20,
			sortBy = 'createdAt',
			sortOrder = 'desc'
		} = findFavoritesDto

		const skip = (page - 1) * limit

		// Build filter conditions
		const where: Prisma.UserFavoriteWhereInput = {
			userId,
			...(categoryId && {
				media: {
					categoryId
				}
			}),
			...(search && {
				media: {
					OR: [
						{
							searchableTitle: {
								contains: this.normalizeTitle(search),
								mode: 'insensitive'
							}
						},
						{
							mediaData: {
								path: ['title'],
								string_contains: search
							}
						},
						{
							mediaData: {
								path: ['originalTitle'],
								string_contains: search
							}
						}
					]
				}
			})
		}

		// Execute queries in parallel
		const [favorites, total] = await Promise.all([
			this.prisma.userFavorite.findMany({
				where,
				skip,
				take: limit,
				orderBy: { [sortBy]: sortOrder },
				include: {
					media: {
						include: {
							category: true,
							addedBy: {
								select: {
									id: true,
									displayName: true,
									picture: true
								}
							},
							_count: {
								select: {
									favorites: true,
									library: true,
									reviews: true
								}
							}
						}
					}
				}
			}),
			this.prisma.userFavorite.count({ where })
		])

		return {
			data: favorites,
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

	async isMediaInFavorites(
		userId: string,
		mediaId: string
	): Promise<boolean> {
		const favorite = await this.prisma.userFavorite.findUnique({
			where: {
				userId_mediaId: {
					userId,
					mediaId
				}
			}
		})

		return !!favorite
	}

	async toggleFavorite(
		userId: string,
		mediaId: string
	): Promise<{ isInFavorites: boolean }> {
		// Check if media exists
		const media = await this.prisma.media.findUnique({
			where: { id: mediaId },
			select: { id: true }
		})

		if (!media) {
			throw new NotFoundException('Media not found')
		}

		// Check current state and toggle in one operation
		const existingFavorite = await this.prisma.userFavorite.findUnique({
			where: {
				userId_mediaId: {
					userId,
					mediaId
				}
			}
		})

		if (existingFavorite) {
			// Remove from favorites
			await this.prisma.userFavorite.delete({
				where: {
					userId_mediaId: {
						userId,
						mediaId
					}
				}
			})
			return { isInFavorites: false }
		} else {
			// Add to favorites
			await this.prisma.userFavorite.create({
				data: {
					userId,
					mediaId
				}
			})
			return { isInFavorites: true }
		}
	}

	async getMediaFavoritesCount(mediaId: string): Promise<number> {
		return this.prisma.userFavorite.count({
			where: { mediaId }
		})
	}

	async getMostFavoritedMedia(limit: number = 10) {
		const favorites = await this.prisma.userFavorite.groupBy({
			by: ['mediaId'],
			_count: {
				mediaId: true
			},
			orderBy: {
				_count: {
					mediaId: 'desc'
				}
			},
			take: limit
		})

		// Get media details for each favorite
		const mediaIds = favorites.map(f => f.mediaId)
		const media = await this.prisma.media.findMany({
			where: {
				id: {
					in: mediaIds
				}
			},
			include: {
				category: true,
				addedBy: {
					select: {
						id: true,
						displayName: true,
						picture: true
					}
				},
				_count: {
					select: {
						favorites: true,
						library: true,
						reviews: true
					}
				}
			}
		})

		// Combine media with favorites count
		return favorites.map(favorite => {
			const mediaItem = media.find(m => m.id === favorite.mediaId)
			return {
				...mediaItem,
				favoritesCount: favorite._count.mediaId
			}
		})
	}

	private normalizeTitle(title: string): string {
		return title
			.toLowerCase()
			.replace(/[^\p{L}\p{N}\s]/gu, '') // Remove special characters, keep letters, numbers and spaces
			.replace(/\s+/g, ' ') // Replace multiple spaces with single spaces
			.trim()
	}
}
