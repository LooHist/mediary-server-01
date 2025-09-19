import {
	BadRequestException,
	Injectable,
	NotFoundException
} from '@nestjs/common'
import { Media, Prisma } from '@prisma/client'

import { PrismaService } from '../prisma/prisma.service'

import { CreateMediaDto, FindMediaDto, UpdateMediaDto } from './dto'

@Injectable()
export class MediaService {
	constructor(private readonly prisma: PrismaService) {}

	async create(createMediaDto: CreateMediaDto): Promise<Media> {
		const { mediaData, categoryId, addedById, source, externalId } =
			createMediaDto

		// Check if category exists
		const category = await this.prisma.category.findUnique({
			where: { id: categoryId }
		})

		if (!category) {
			throw new BadRequestException('Category not found')
		}

		// Normalize title for duplicate search
		const searchableTitle = this.normalizeTitle(mediaData.title)

		// Check for duplicates with more precise logic (title + year + category or source+externalId)
		const year = (mediaData as any)?.year as number | undefined
		await this.checkForDuplicates({
			searchableTitle,
			categoryId,
			year,
			source,
			externalId
		})

		// Create externalIds array
		const externalIds = externalId ? { [source]: externalId } : null

		const media = await this.prisma.media.create({
			data: {
				source,
				externalId,
				mediaData: mediaData as Prisma.JsonObject,
				searchableTitle,
				externalIds: externalIds as Prisma.JsonObject,
				categoryId,
				addedById
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
						library: true,
						reviews: true,
						favorites: true
					}
				}
			}
		})

		return media
	}

	async findAll(findMediaDto: FindMediaDto) {
		const {
			search,
			categoryId,
			source,
			year,
			page = 1,
			limit = 20,
			sortBy = 'createdAt',
			sortOrder = 'desc'
		} = findMediaDto

		const skip = (page - 1) * limit

		// Build filter conditions
		const where: Prisma.MediaWhereInput = {
			...(categoryId && { categoryId }),
			...(source && { source }),
			...(search && {
				OR: [
					{
						searchableTitle: {
							contains: this.normalizeTitle(search),
							mode: 'insensitive'
						}
					},
					{ mediaData: { path: ['title'], string_contains: search } },
					{
						mediaData: {
							path: ['originalTitle'],
							string_contains: search
						}
					}
				]
			}),
			...(year && {
				mediaData: {
					path: ['year'],
					equals: year
				}
			})
		}

		// Execute queries in parallel
		const [media, total] = await Promise.all([
			this.prisma.media.findMany({
				where,
				skip,
				take: limit,
				orderBy: { [sortBy]: sortOrder },
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
							library: true,
							reviews: true
						}
					}
				}
			}),
			this.prisma.media.count({ where })
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

	async findOne(id: string): Promise<Media> {
		const media = await this.prisma.media.findUnique({
			where: { id },
			include: {
				category: true,
				addedBy: {
					select: {
						id: true,
						displayName: true,
						picture: true
					}
				},
				reviews: {
					include: {
						user: {
							select: {
								id: true,
								displayName: true,
								picture: true
							}
						}
					},
					orderBy: { createdAt: 'desc' }
				},
				_count: {
					select: {
						library: true,
						reviews: true,
						favorites: true
					}
				}
			}
		})

		if (!media) {
			throw new NotFoundException('Media not found')
		}

		return media
	}

	async update(id: string, updateMediaDto: UpdateMediaDto): Promise<Media> {
		// Check if media exists
		const existingMedia = await this.findOne(id)

		const { mediaData, categoryId, ...rest } = updateMediaDto

		// If we are updating the category, check if it exists
		if (categoryId) {
			const category = await this.prisma.category.findUnique({
				where: { id: categoryId }
			})

			if (!category) {
				throw new BadRequestException('Category not found')
			}
		}

		// If we are updating mediaData, we need to recalculate searchableTitle
		let searchableTitle: string | undefined
		if (mediaData && mediaData.title) {
			searchableTitle = this.normalizeTitle(mediaData.title)
		}

		const updatedMedia = await this.prisma.media.update({
			where: { id },
			data: {
				...rest,
				...(mediaData && { mediaData: mediaData as Prisma.JsonObject }),
				...(searchableTitle && { searchableTitle }),
				...(categoryId && { categoryId })
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
						library: true,
						reviews: true,
						favorites: true
					}
				}
			}
		})

		return updatedMedia
	}

	async remove(id: string): Promise<void> {
		// Check if media exists
		await this.findOne(id)

		await this.prisma.media.delete({
			where: { id }
		})
	}

	async findByExternalId(
		source: string,
		externalId: string
	): Promise<Media | null> {
		return this.prisma.media.findFirst({
			where: {
				source: source as any,
				externalId
			},
			include: {
				category: true,
				addedBy: {
					select: {
						id: true,
						displayName: true,
						picture: true
					}
				}
			}
		})
	}

	async findDuplicates(title: string, externalId?: string): Promise<Media[]> {
		const searchableTitle = this.normalizeTitle(title)

		const where: Prisma.MediaWhereInput = {
			OR: [
				{
					searchableTitle: {
						contains: searchableTitle,
						mode: 'insensitive'
					}
				},
				...(externalId ? [{ externalId }] : [])
			]
		}

		return this.prisma.media.findMany({
			where,
			include: {
				category: true,
				addedBy: {
					select: {
						id: true,
						displayName: true,
						picture: true
					}
				}
			}
		})
	}

	async getMediaStats(id: string) {
		const media = await this.findOne(id)

		const [avgRating, ratingDistribution] = await Promise.all([
			this.prisma.review.aggregate({
				where: { mediaId: id },
				_avg: { rating: true },
				_count: { rating: true }
			}),
			this.prisma.review.groupBy({
				by: ['rating'],
				where: { mediaId: id },
				_count: { rating: true },
				orderBy: { rating: 'asc' }
			})
		])

		return {
			media,
			stats: {
				averageRating: avgRating._avg.rating || 0,
				totalReviews: avgRating._count.rating,
				ratingDistribution: ratingDistribution.map(item => ({
					rating: item.rating,
					count: item._count.rating
				}))
			}
		}
	}

	private async checkForDuplicates(params: {
		searchableTitle: string
		categoryId: string
		year?: number
		source?: any
		externalId?: string
	}): Promise<void> {
		const { searchableTitle, categoryId, year, source, externalId } = params

		// If there is an external ID, check by source + externalId
		if (externalId && source) {
			const existsByExternal = await this.prisma.media.findFirst({
				where: { source: source as any, externalId },
				select: { id: true }
			})
			if (existsByExternal) {
				throw new BadRequestException(
					'Media with this externalId already exists'
				)
			}
		}

		// Check by exact title + category + year (if there is a year)
		const where: Prisma.MediaWhereInput = {
			searchableTitle: { equals: searchableTitle, mode: 'insensitive' },
			categoryId,
			...(year !== undefined
				? { mediaData: { path: ['year'], equals: year } }
				: {})
		}

		const duplicates = await this.prisma.media.findMany({
			where,
			select: { id: true }
		})

		if (duplicates.length > 0) {
			throw new BadRequestException(
				'Media with this title already exists in this category for this year'
			)
		}
	}

	private normalizeTitle(title: string): string {
		return title
			.toLowerCase()
			.replace(/[^\p{L}\p{N}\s]/gu, '') // Remove special characters, keep letters, numbers and spaces
			.replace(/\s+/g, ' ') // Replace multiple spaces with single spaces
			.trim()
	}
}
