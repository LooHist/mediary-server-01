import { Module } from '@nestjs/common'

import { FavoritesModule } from '../favorites/favorites.module'
import { PrismaModule } from '../prisma/prisma.module'
import { UserModule } from '../user/user.module'

import { MediaController } from './media.controller'
import { MediaService } from './media.service'

@Module({
	imports: [PrismaModule, UserModule, FavoritesModule],
	controllers: [MediaController],
	providers: [MediaService],
	exports: [MediaService]
})
export class MediaModule {}
