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
import { ModerationType, UserRole } from '@prisma/client'

import { Roles } from '../auth/decorators/roles.decorator'
import { AuthGuard } from '../auth/guards/auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'

import {
	CreateMediaRequestDto,
	FindRequestsDto,
	ModerateRequestDto,
	UpdateRequestDto
} from './dto'
import { MediaRequestService } from './media-request.service'

@Controller('media-requests')
@UseGuards(AuthGuard)
export class MediaRequestController {
	constructor(private readonly mediaRequestService: MediaRequestService) {}

	// Create a new media request
	@Post()
	create(
		@Request() req: any,
		@Body() createRequestDto: CreateMediaRequestDto
	) {
		return this.mediaRequestService.create(req.user.id, createRequestDto)
	}

	// Get all requests (with access rights)
	@Get()
	findAll(@Request() req: any, @Query() findRequestsDto: FindRequestsDto) {
		return this.mediaRequestService.findAll(
			findRequestsDto,
			req.user.id,
			req.user.role
		)
	}

	// Get requests statistics (admins only)
	@Get('stats')
	@UseGuards(RolesGuard)
	@Roles(UserRole.ADMIN)
	getStats() {
		return this.mediaRequestService.getRequestsStats()
	}

	// Get current user's requests
	@Get('my')
	getMyRequests(
		@Request() req: any,
		@Query('status') status?: ModerationType
	) {
		return this.mediaRequestService.getUserRequests(req.user.id, status)
	}

	// Get requests awaiting moderation (admins and moderators only)
	// Moderators and admins see all requests awaiting moderation
	@Get('pending')
	@UseGuards(RolesGuard)
	@Roles(UserRole.ADMIN, UserRole.MODERATOR)
	getPendingRequests(
		@Request() req: any,
		@Query() findRequestsDto: FindRequestsDto
	) {
		// For endpoint /pending, moderators and admins should see all requests
		// So we pass skipUserFilter = true through a separate call
		return this.mediaRequestService.findAllForModeration(
			{
				...findRequestsDto,
				status: ModerationType.PENDING
			},
			req.user.role
		)
	}

	// Get a specific request
	@Get(':id')
	findOne(@Request() req: any, @Param('id') id: string) {
		return this.mediaRequestService.findOne(id, req.user.id, req.user.role)
	}

	// Moderate request (approve/reject) - admins and moderators
	@Patch(':id/moderate')
	@UseGuards(RolesGuard)
	@Roles(UserRole.ADMIN, UserRole.MODERATOR)
	moderate(
		@Request() req: any,
		@Param('id') id: string,
		@Body() moderateDto: ModerateRequestDto
	) {
		return this.mediaRequestService.moderate(id, req.user.id, moderateDto)
	}

	// Update request by user
	@Patch(':id')
	update(
		@Request() req: any,
		@Param('id') id: string,
		@Body() updateDto: UpdateRequestDto
	) {
		return this.mediaRequestService.update(id, req.user.id, updateDto)
	}

	// Delete request
	@Delete(':id')
	remove(@Request() req: any, @Param('id') id: string) {
		return this.mediaRequestService.remove(id, req.user.id, req.user.role)
	}
}
