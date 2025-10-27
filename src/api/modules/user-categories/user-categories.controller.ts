import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Query,
	Request,
	UseGuards,
	UsePipes,
	ValidationPipe
} from '@nestjs/common'

import { AuthGuard } from '../auth/guards/auth.guard'

import { AddCategoryDto, RemoveCategoryDto } from './dto'
import { UserCategoriesService } from './user-categories.service'

@Controller('user-categories')
@UseGuards(AuthGuard)
@UsePipes(new ValidationPipe())
export class UserCategoriesController {
	constructor(
		private readonly userCategoriesService: UserCategoriesService
	) {}

	// Get the user's personal categories
	@Get()
	async getUserCategories(@Request() req: any) {
		return this.userCategoriesService.getUserCategories(req.user.id)
	}

	// Get all categories with information about whether they are added to the user
	@Get('all')
	async getAllCategoriesWithUserStatus(@Request() req: any) {
		return this.userCategoriesService.getAllCategoriesWithUserStatus(
			req.user.id
		)
	}

	// Get available categories for adding
	@Get('available')
	async getAvailableCategories(@Request() req: any) {
		return this.userCategoriesService.getAvailableCategories(req.user.id)
	}

	// Add a category to the user's personal categories
	@Post()
	async addCategory(
		@Request() req: any,
		@Body() addCategoryDto: AddCategoryDto
	) {
		return this.userCategoriesService.addCategoryToUser(
			req.user.id,
			addCategoryDto.categoryId
		)
	}

	// Remove a category from the user's personal categories
	@Delete()
	async removeCategory(
		@Request() req: any,
		@Query() removeCategoryDto: RemoveCategoryDto
	) {
		await this.userCategoriesService.removeCategoryFromUser(
			req.user.id,
			removeCategoryDto.categoryId
		)
		return { categoryId: removeCategoryDto.categoryId }
	}
}
