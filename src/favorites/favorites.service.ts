import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'

import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class FavoritesService {
	constructor(private readonly prisma: PrismaService) {}

	async checkMultipleFavorites(
		userId: string,
		mediaIds: string[]
	): Promise<Record<string, boolean>> {
		const favorites = await this.prisma.userFavorite.findMany({
			where: {
				userId,
				mediaId: {
					in: mediaIds
				}
			},
			select: {
				mediaId: true
			}
		})

		const favoritesSet = new Set(favorites.map(f => f.mediaId))
		const result: Record<string, boolean> = {}

		for (const mediaId of mediaIds) {
			result[mediaId] = favoritesSet.has(mediaId)
		}

		return result
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
}
