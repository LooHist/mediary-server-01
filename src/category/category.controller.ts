import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common'
import { UserRole } from '@prisma/client'

import { Roles } from '../auth/decorators/roles.decorator'
import { AuthGuard } from '../auth/guards/auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'

import { CategoryService } from './category.service'

@Controller('categories')
export class CategoryController {
	constructor(private readonly categoryService: CategoryService) {}

	// Отримання всіх категорій (публічно)
	@Get()
	findAll() {
		return this.categoryService.findAll()
	}

	// Ініціалізація початкових категорій (тільки адміни)
	@Get('seed')
	@UseGuards(AuthGuard, RolesGuard)
	@Roles(UserRole.ADMIN)
	seedInitial() {
		return this.categoryService.seedInitialCategories()
	}

	// Отримання категорії за ID (публічно)
	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.categoryService.findOne(id)
	}

	// Отримання медіа категорії (публічно)
	@Get(':id/media')
	getCategoryMedia(
		@Param('id') id: string,
		@Query('page') page?: number,
		@Query('limit') limit?: number
	) {
		return this.categoryService.getCategoryMedia(id, page, limit)
	}
}
