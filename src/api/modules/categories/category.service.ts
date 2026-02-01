import { PrismaService } from '@database/prisma'
import { Injectable } from '@nestjs/common'
import { Category } from '@prisma/client'

@Injectable()
export class CategoryService {
	constructor(private readonly prisma: PrismaService) {}

	// Fixed list of categories
	private readonly FIXED_CATEGORIES = [
		{ name: 'Movies' },
		{ name: 'Series' },
		{ name: 'Books' },
		{ name: 'Anime' },
		{ name: 'Games' },
		{ name: 'KDramas' },
		{ name: 'Manga' },
		{ name: 'Manhwa' }
	] as const

	// Initialize fixed categories
	async seedInitialCategories(): Promise<Category[]> {
		const categories: Category[] = []

		for (const categoryData of this.FIXED_CATEGORIES) {
			const category = await this.prisma.category.upsert({
				where: { name: categoryData.name },
				update: {},
				create: categoryData
			})
			categories.push(category)
		}

		return categories
	}

	// Get all categories
	async findAll() {
		return this.prisma.category.findMany({
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

	// Get category by ID
	async findOne(id: string): Promise<Category> {
		const category = await this.prisma.category.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						media: true
					}
				}
			}
		})

		if (!category) {
			throw new Error('Category not found')
		}

		return category
	}

	// Get category by name
	async findByName(name: string): Promise<Category | null> {
		return this.prisma.category.findUnique({
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

	// Get category media with pagination
	async getCategoryMedia(
		categoryId: string,
		page: number = 1,
		limit: number = 20
	) {
		// Check if category exists
		await this.findOne(categoryId)

		const skip = (page - 1) * limit

		const [media, total] = await Promise.all([
			this.prisma.media.findMany({
				where: { categoryId },
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
			this.prisma.media.count({ where: { categoryId } })
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
