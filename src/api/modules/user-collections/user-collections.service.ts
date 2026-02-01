import { PrismaService } from '@database/prisma'
import { Injectable } from '@nestjs/common'
import { Collection, UserCollection } from '@prisma/client'

import { CollectionService } from '../collections/collection.service'

@Injectable()
export class UserCollectionsService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly collectionService: CollectionService
	) {}

	// Get the user's personal collections
	async getUserCollections(userId: string): Promise<Collection[]> {
		const userCollections = await this.prisma.userCollection.findMany({
			where: { userId },
			include: {
				collection: true
			},
			orderBy: {
				collection: {
					name: 'asc'
				}
			}
		})

		return userCollections.map(uc => uc.collection)
	}

	// Get all collections with information about whether they are added to the user
	async getAllCollectionsWithUserStatus(
		userId: string
	): Promise<Array<Collection & { isAdded: boolean }>> {
		const allCollections = await this.collectionService.findAll()
		const userCollections = await this.prisma.userCollection.findMany({
			where: { userId },
			select: { collectionId: true }
		})

		const userCollectionIds = userCollections.map(uc => uc.collectionId)

		return allCollections.map(collection => ({
			...collection,
			isAdded: userCollectionIds.includes(collection.id)
		}))
	}

	// Get available collections for adding (which are not added to the user)
	async getAvailableCollections(userId: string): Promise<Collection[]> {
		const allCollections = await this.collectionService.findAll()
		const userCollections = await this.prisma.userCollection.findMany({
			where: { userId },
			select: { collectionId: true }
		})

		const userCollectionIds = userCollections.map(uc => uc.collectionId)

		return allCollections.filter(
			collection => !userCollectionIds.includes(collection.id)
		)
	}

	// Add a collection to the user's personal collections
	async addCollectionToUser(
		userId: string,
		collectionId: string
	): Promise<UserCollection> {
		// Check if the collection exists
		const collection = await this.collectionService.findOne(collectionId)

		// Check if the collection is already added
		const existing = await this.prisma.userCollection.findUnique({
			where: {
				userId_collectionId: {
					userId,
					collectionId
				}
			}
		})

		if (existing) {
			throw new Error(
				"Collection already added to the user's personal collections"
			)
		}

		const result = await this.prisma.userCollection.create({
			data: {
				userId,
				collectionId
			},
			include: {
				collection: true
			}
		})

		return result
	}

	// Remove a collection from the user's personal collections
	async removeCollectionFromUser(
		userId: string,
		collectionId: string
	): Promise<void> {
		const userCollection = await this.prisma.userCollection.findUnique({
			where: {
				userId_collectionId: {
					userId,
					collectionId
				}
			}
		})

		if (!userCollection) {
			throw new Error(
				"Collection not found in the user's personal collections"
			)
		}

		// Remove all media from the user's collection
		await this.prisma.userLibrary.deleteMany({
			where: {
				userId,
				media: {
					collectionId
				}
			}
		})

		// Remove all reviews from the user's media from this collection
		await this.prisma.review.deleteMany({
			where: {
				userId,
				media: {
					collectionId
				}
			}
		})

		// Remove the personal collection
		await this.prisma.userCollection.delete({
			where: {
				userId_collectionId: {
					userId,
					collectionId
				}
			}
		})
	}

	// Initialize default collections for a new user
	async initializeDefaultCollections(userId: string): Promise<UserCollection[]> {
		const defaultCollections = ['Movies', 'Series']
		const userCollections: UserCollection[] = []

		for (const collectionName of defaultCollections) {
			const collection = await this.collectionService.findByName(collectionName)
			if (collection) {
				const userCollection = await this.prisma.userCollection.create({
					data: {
						userId,
						collectionId: collection.id
					},
					include: {
						collection: true
					}
				})
				userCollections.push(userCollection)
			}
		}

		return userCollections
	}
}




