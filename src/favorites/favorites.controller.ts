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

import { FindFavoritesDto } from './dto'
import { FavoritesService } from './favorites.service'

@Controller('favorites')
@UseGuards(AuthGuard)
export class FavoritesController {
	constructor(private readonly favoritesService: FavoritesService) {}

	@Get()
	async getUserFavorites(
		@Authorized('id') userId: string,
		@Query() findFavoritesDto: FindFavoritesDto
	) {
		return this.favoritesService.getUserFavorites(userId, findFavoritesDto)
	}

	@Get('check/:mediaId')
	async isMediaInFavorites(
		@Authorized('id') userId: string,
		@Param('mediaId') mediaId: string
	) {
		const isInFavorites = await this.favoritesService.isMediaInFavorites(
			userId,
			mediaId
		)
		return { isInFavorites }
	}

	@Post('toggle/:mediaId')
	async toggleFavorite(
		@Authorized('id') userId: string,
		@Param('mediaId') mediaId: string
	) {
		return this.favoritesService.toggleFavorite(userId, mediaId)
	}

	@Get('popular')
	async getMostFavoritedMedia(@Query('limit') limit?: string) {
		const limitNumber = limit ? parseInt(limit, 10) : 10
		return this.favoritesService.getMostFavoritedMedia(limitNumber)
	}
}
