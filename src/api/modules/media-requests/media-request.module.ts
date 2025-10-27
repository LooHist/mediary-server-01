import { PrismaModule } from '@database/prisma'
import { Module } from '@nestjs/common'

import { UserModule } from '../users/user.module'

import { MediaRequestController } from './media-request.controller'
import { MediaRequestService } from './media-request.service'

@Module({
	imports: [PrismaModule, UserModule],
	controllers: [MediaRequestController],
	providers: [MediaRequestService],
	exports: [MediaRequestService]
})
export class MediaRequestModule {}
