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

import { AddCollectionDto, RemoveCollectionDto } from './dto'
import { UserCollectionsService } from './user-collections.service'

@Controller('user-collections')
@UseGuards(AuthGuard)
@UsePipes(new ValidationPipe())
export class UserCollectionsController {
	constructor(
		private readonly userCollectionsService: UserCollectionsService
	) {}

	// Get the user's personal collections
	@Get()
	async getUserCollections(@Request() req: any) {
		return this.userCollectionsService.getUserCollections(req.user.id)
	}

	// Get all collections with information about whether they are added to the user
	@Get('all')
	async getAllCollectionsWithUserStatus(@Request() req: any) {
		return this.userCollectionsService.getAllCollectionsWithUserStatus(
			req.user.id
		)
	}

	// Get available collections for adding
	@Get('available')
	async getAvailableCollections(@Request() req: any) {
		return this.userCollectionsService.getAvailableCollections(req.user.id)
	}

	// Add a collection to the user's personal collections
	@Post()
	async addCollection(
		@Request() req: any,
		@Body() addCollectionDto: AddCollectionDto
	) {
		return this.userCollectionsService.addCollectionToUser(
			req.user.id,
			addCollectionDto.collectionId
		)
	}

	// Remove a collection from the user's personal collections
	@Delete()
	async removeCollection(
		@Request() req: any,
		@Query() removeCollectionDto: RemoveCollectionDto
	) {
		await this.userCollectionsService.removeCollectionFromUser(
			req.user.id,
			removeCollectionDto.collectionId
		)
		return { collectionId: removeCollectionDto.collectionId }
	}
}




