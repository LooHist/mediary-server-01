import { PrismaModule } from '@database/prisma'
import { Module } from '@nestjs/common'

import { UserModule } from '../users/user.module'

import { MediaRequestController } from './media-request.controller'
import { MediaRequestFilteringService } from './filtering'
import { MediaRequestModerationService } from './moderation'
import { MediaRequestCrudService } from './requests'
import { MediaRequestService } from './media-request.service'
import { MediaRequestStatsService } from './stats'
import { MediaRequestValidationService } from './validation'

@Module({
	imports: [PrismaModule, UserModule],
	controllers: [MediaRequestController],
	providers: [
		MediaRequestService,
		MediaRequestCrudService,
		MediaRequestFilteringService,
		MediaRequestModerationService,
		MediaRequestStatsService,
		MediaRequestValidationService
	],
	exports: [MediaRequestService]
})
export class MediaRequestModule {}
