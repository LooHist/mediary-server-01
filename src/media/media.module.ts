import { Module } from '@nestjs/common'

import { PrismaModule } from '../prisma/prisma.module'
import { UserModule } from '../user/user.module'

import { MediaController } from './media.controller'
import { MediaService } from './media.service'

@Module({
	imports: [PrismaModule, UserModule],
	controllers: [MediaController],
	providers: [MediaService],
	exports: [MediaService]
})
export class MediaModule {}
