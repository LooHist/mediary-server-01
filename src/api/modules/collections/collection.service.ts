import { PrismaService } from '@database/prisma'
import { Injectable } from '@nestjs/common'
import { Collection } from '@prisma/client'

@Injectable()
export class CollectionService {
	constructor(private readonly prisma: PrismaService) {}

	// Fixed list of collections
	private readonly FIXED_COLLECTIONS = [
		{ name: 'Movies' },
		{ name: 'Series' },
		{ name: 'Books' },
		{ name: 'Anime' },
		{ name: 'Games' },
		{ name: 'KDramas' },
		{ name: 'Manga' },
		{ name: 'Manhwa' }
	] as const

	// Initialize fixed collections
	async seedInitialCollections(): Promise<Collection[]> {
		const collections: Collection[] = []

		for (const collectionData of this.FIXED_COLLECTIONS) {
			const collection = await this.prisma.collection.upsert({
				where: { name: collectionData.name },
				update: {},
				create: collectionData
			})
			collections.push(collection)
		}

		return collections
	}

	// Get all collections
	async findAll() {
		return this.prisma.collection.findMany({
			orderBy: { name: 'asc' },
			include: {
				_count: {
					select: {
						media: true
					}
				}
			}
		})
	}

	// Get collection by ID
	async findOne(id: string): Promise<Collection> {
		const collection = await this.prisma.collection.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						media: true
					}
				}
			}
		})

		if (!collection) {
			throw new Error('Collection not found')
		}

		return collection
	}

	// Get collection by name
	async findByName(name: string): Promise<Collection | null> {
		return this.prisma.collection.findUnique({
			where: { name },
			include: {
				_count: {
					select: {
						media: true
					}
				}
			}
		})
	}

	// Get collection media with pagination
	async getCollectionMedia(
		collectionId: string,
		page: number = 1,
		limit: number = 20
	) {
		// Check if collection exists
		await this.findOne(collectionId)

		const skip = (page - 1) * limit

		const [media, total] = await Promise.all([
			this.prisma.media.findMany({
				where: { collectionId },
				skip,
				take: limit,
				include: {
					addedBy: {
						select: {
							id: true,
							displayName: true,
							picture: true
						}
					},
					_count: {
						select: {
							library: true,
							reviews: true
						}
					}
				},
				orderBy: { createdAt: 'desc' }
			}),
			this.prisma.media.count({ where: { collectionId } })
		])

		return {
			data: media,
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
}




