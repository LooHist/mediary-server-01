import { Injectable } from '@nestjs/common'
import { Category, UserCategory } from '@prisma/client'

import { CategoryService } from '../category/category.service'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class UserCategoriesService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly categoryService: CategoryService
	) {}

	// Get the user's personal categories
	async getUserCategories(userId: string): Promise<Category[]> {
		const userCategories = await this.prisma.userCategory.findMany({
			where: { userId },
			include: {
				category: true
			},
			orderBy: {
				category: {
					name: 'asc'
				}
			}
		})

		return userCategories.map(uc => uc.category)
	}

	// Get all categories with information about whether they are added to the user
	async getAllCategoriesWithUserStatus(
		userId: string
	): Promise<Array<Category & { isAdded: boolean }>> {
		const allCategories = await this.categoryService.findAll()
		const userCategories = await this.prisma.userCategory.findMany({
			where: { userId },
			select: { categoryId: true }
		})

		const userCategoryIds = userCategories.map(uc => uc.categoryId)

		return allCategories.map(category => ({
			...category,
			isAdded: userCategoryIds.includes(category.id)
		}))
	}

	// Get available categories for adding (which are not added to the user)
	async getAvailableCategories(userId: string): Promise<Category[]> {
		const allCategories = await this.categoryService.findAll()
		const userCategories = await this.prisma.userCategory.findMany({
			where: { userId },
			select: { categoryId: true }
		})

		const userCategoryIds = userCategories.map(uc => uc.categoryId)

		return allCategories.filter(
			category => !userCategoryIds.includes(category.id)
		)
	}

	// Add a category to the user's personal categories
	async addCategoryToUser(
		userId: string,
		categoryId: string
	): Promise<UserCategory> {
		// Check if the category exists
		const category = await this.categoryService.findOne(categoryId)

		// Check if the category is already added
		const existing = await this.prisma.userCategory.findUnique({
			where: {
				userId_categoryId: {
					userId,
					categoryId
				}
			}
		})

		if (existing) {
			throw new Error(
				"Category already added to the user's personal categories"
			)
		}

		const result = await this.prisma.userCategory.create({
			data: {
				userId,
				categoryId
			},
			include: {
				category: true
			}
		})

		return result
	}

	// Remove a category from the user's personal categories
	async removeCategoryFromUser(
		userId: string,
		categoryId: string
	): Promise<void> {
		const userCategory = await this.prisma.userCategory.findUnique({
			where: {
				userId_categoryId: {
					userId,
					categoryId
				}
			}
		})

		if (!userCategory) {
			throw new Error(
				"Category not found in the user's personal categories"
			)
		}

		// Remove all media from the user's category
		await this.prisma.userLibrary.deleteMany({
			where: {
				userId,
				media: {
					categoryId
				}
			}
		})

		// Remove all reviews from the user's media from this category
		await this.prisma.review.deleteMany({
			where: {
				userId,
				media: {
					categoryId
				}
			}
		})

		// Remove the personal category
		await this.prisma.userCategory.delete({
			where: {
				userId_categoryId: {
					userId,
					categoryId
				}
			}
		})
	}

	// Initialize default categories for a new user
	async initializeDefaultCategories(userId: string): Promise<UserCategory[]> {
		const defaultCategories = ['Movies', 'Series']
		const userCategories: UserCategory[] = []

		for (const categoryName of defaultCategories) {
			const category = await this.categoryService.findByName(categoryName)
			if (category) {
				const userCategory = await this.prisma.userCategory.create({
					data: {
						userId,
						categoryId: category.id
					},
					include: {
						category: true
					}
				})
				userCategories.push(userCategory)
			}
		}

		return userCategories
	}
}
