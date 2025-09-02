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

	// Створення нового запиту на додавання медіа
	@Post()
	create(
		@Request() req: any,
		@Body() createRequestDto: CreateMediaRequestDto
	) {
		return this.mediaRequestService.create(req.user.id, createRequestDto)
	}

	// Отримання всіх запитів (з правами доступу)
	@Get()
	findAll(@Request() req: any, @Query() findRequestsDto: FindRequestsDto) {
		return this.mediaRequestService.findAll(
			findRequestsDto,
			req.user.id,
			req.user.role
		)
	}

	// Отримання статистики запитів (тільки адміни)
	@Get('stats')
	@UseGuards(RolesGuard)
	@Roles(UserRole.ADMIN)
	getStats() {
		return this.mediaRequestService.getRequestsStats()
	}

	// Отримання запитів поточного користувача
	@Get('my')
	getMyRequests(
		@Request() req: any,
		@Query('status') status?: ModerationType
	) {
		return this.mediaRequestService.getUserRequests(req.user.id, status)
	}

	// Отримання запитів що очікують модерації (тільки адміни)
	@Get('pending')
	@UseGuards(RolesGuard)
	@Roles(UserRole.ADMIN)
	getPendingRequests(@Query() findRequestsDto: FindRequestsDto) {
		return this.mediaRequestService.findAll({
			...findRequestsDto,
			status: ModerationType.PENDING
		})
	}

	// Отримання конкретного запиту
	@Get(':id')
	findOne(@Request() req: any, @Param('id') id: string) {
		return this.mediaRequestService.findOne(id, req.user.id, req.user.role)
	}

	// Модерація запиту (схвалення/відхилення) - тільки адміни
	@Patch(':id/moderate')
	@UseGuards(RolesGuard)
	@Roles(UserRole.ADMIN)
	moderate(
		@Request() req: any,
		@Param('id') id: string,
		@Body() moderateDto: ModerateRequestDto
	) {
		return this.mediaRequestService.moderate(id, req.user.id, moderateDto)
	}

	// Оновлення запиту користувачем
	@Patch(':id')
	update(
		@Request() req: any,
		@Param('id') id: string,
		@Body() updateDto: UpdateRequestDto
	) {
		return this.mediaRequestService.update(id, req.user.id, updateDto)
	}

	// Видалення запиту
	@Delete(':id')
	remove(@Request() req: any, @Param('id') id: string) {
		return this.mediaRequestService.remove(id, req.user.id, req.user.role)
	}
}
