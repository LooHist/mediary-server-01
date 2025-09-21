import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Query,
	UseGuards
} from '@nestjs/common'

import { Authorized } from '../auth/decorators/authorized.decorator'
import { AuthGuard } from '../auth/guards/auth.guard'

import { FavoritesService } from './favorites.service'

@Controller('favorites')
@UseGuards(AuthGuard)
export class FavoritesController {
	constructor(private readonly favoritesService: FavoritesService) {}

	@Post('check-batch')
	async checkMultipleFavorites(
		@Authorized('id') userId: string,
		@Body() body: { mediaIds: string[] }
	) {
		return this.favoritesService.checkMultipleFavorites(
			userId,
			body.mediaIds
		)
	}

	@Post('toggle/:mediaId')
	async toggleFavorite(
		@Authorized('id') userId: string,
		@Param('mediaId') mediaId: string
	) {
		return this.favoritesService.toggleFavorite(userId, mediaId)
	}
}
