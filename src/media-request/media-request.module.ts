import { Module } from '@nestjs/common'

import { PrismaModule } from '../prisma/prisma.module'
import { UserModule } from '../user/user.module'

import { MediaRequestController } from './media-request.controller'
import { MediaRequestService } from './media-request.service'

@Module({
	imports: [PrismaModule, UserModule],
	controllers: [MediaRequestController],
	providers: [MediaRequestService],
	exports: [MediaRequestService]
})
export class MediaRequestModule {}
