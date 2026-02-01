import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common'
import { UserRole } from '@prisma/client'

import { Roles } from '../auth/decorators/roles.decorator'
import { AuthGuard } from '../auth/guards/auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'

import { CollectionService } from './collection.service'

@Controller('collections')
export class CollectionController {
	constructor(private readonly collectionService: CollectionService) {}

	// Get all collections (public)
	@Get()
	findAll() {
		return this.collectionService.findAll()
	}

	// Initialize initial collections (admins only)
	@Get('seed')
	@UseGuards(AuthGuard, RolesGuard)
	@Roles(UserRole.ADMIN)
	seedInitial() {
		return this.collectionService.seedInitialCollections()
	}

	// Get collection by ID (public)
	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.collectionService.findOne(id)
	}

	// Get collection media (public)
	@Get(':id/media')
	getCollectionMedia(
		@Param('id') id: string,
		@Query('page') page?: number,
		@Query('limit') limit?: number
	) {
		return this.collectionService.getCollectionMedia(id, page, limit)
	}
}




