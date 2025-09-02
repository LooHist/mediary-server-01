import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	Query,
	Request,
	UseGuards
} from '@nestjs/common'

import { AuthGuard } from '../auth/guards/auth.guard'

import { AddFromSearchDto, GetLibraryDto, UpdateLibraryItemDto } from './dto'
import { UserLibraryService } from './user-library.service'

@Controller('library')
@UseGuards(AuthGuard)
export class UserLibraryController {
	constructor(private readonly userLibraryService: UserLibraryService) {}

	@Post('from-search')
	addFromSearch(
		@Request() req: any,
		@Body() addFromSearchDto: AddFromSearchDto
	) {
		return this.userLibraryService.addFromSearch(
			req.user.id,
			addFromSearchDto
		)
	}

	@Get()
	getLibrary(@Request() req: any, @Query() getLibraryDto: GetLibraryDto) {
		return this.userLibraryService.getUserLibrary(
			req.user.id,
			getLibraryDto
		)
	}

	@Get('genres')
	getGenres(@Request() req: any) {
		return this.userLibraryService.getGenres(req.user.id)
	}

	@Get('all-genres')
	getAllGenres() {
		return this.userLibraryService.getAllGenres()
	}

	@Get('recommendations')
	getRecommendations(@Request() req: any, @Query('limit') limit?: number) {
		return this.userLibraryService.getRecommendations(req.user.id, limit)
	}

	@Get('check/:mediaId')
	checkInLibrary(@Request() req: any, @Param('mediaId') mediaId: string) {
		return this.userLibraryService.isInLibrary(req.user.id, mediaId)
	}

	@Get(':mediaId')
	getLibraryItem(@Request() req: any, @Param('mediaId') mediaId: string) {
		return this.userLibraryService.getLibraryItem(req.user.id, mediaId)
	}

	@Patch(':mediaId')
	updateLibraryItem(
		@Request() req: any,
		@Param('mediaId') mediaId: string,
		@Body() updateDto: UpdateLibraryItemDto
	) {
		return this.userLibraryService.updateLibraryItem(
			req.user.id,
			mediaId,
			updateDto
		)
	}

	@Delete(':mediaId')
	removeFromLibrary(@Request() req: any, @Param('mediaId') mediaId: string) {
		return this.userLibraryService.removeFromLibrary(req.user.id, mediaId)
	}
}
