import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	Query,
	UseGuards
} from '@nestjs/common'
import { UserRole } from '@prisma/client'

import { Authorized } from '../auth/decorators/authorized.decorator'
import { Roles } from '../auth/decorators/roles.decorator'
import { AuthGuard } from '../auth/guards/auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'

import { CreateMediaDto, FindMediaDto, UpdateMediaDto } from './dto'
import { MediaService } from './media.service'

@Controller('media')
export class MediaController {
	constructor(private readonly mediaService: MediaService) {}

	@Post()
	@UseGuards(AuthGuard)
	create(@Body() createMediaDto: CreateMediaDto) {
		return this.mediaService.create(createMediaDto)
	}

	@Get()
	findAll(@Query() findMediaDto: FindMediaDto) {
		return this.mediaService.findAll(findMediaDto)
	}

	@Get('search/duplicates')
	@UseGuards(AuthGuard)
	findDuplicates(
		@Query('title') title: string,
		@Query('externalId') externalId?: string
	) {
		return this.mediaService.findDuplicates(title, externalId)
	}

	@Get('external/:source/:externalId')
	findByExternalId(
		@Param('source') source: string,
		@Param('externalId') externalId: string
	) {
		return this.mediaService.findByExternalId(source, externalId)
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.mediaService.findOne(id)
	}

	@Get(':id/stats')
	getStats(@Param('id') id: string) {
		return this.mediaService.getMediaStats(id)
	}

	@Patch(':id')
	@UseGuards(AuthGuard, RolesGuard)
	@Roles(UserRole.ADMIN)
	update(@Param('id') id: string, @Body() updateMediaDto: UpdateMediaDto) {
		return this.mediaService.update(id, updateMediaDto)
	}

	@Delete(':id')
	@UseGuards(AuthGuard, RolesGuard)
	@Roles(UserRole.ADMIN)
	remove(@Param('id') id: string) {
		return this.mediaService.remove(id)
	}
}
