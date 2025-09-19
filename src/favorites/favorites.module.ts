import { Module } from '@nestjs/common'

import { PrismaModule } from '../prisma/prisma.module'
import { UserModule } from '../user/user.module'

import { FavoritesController } from './favorites.controller'
import { FavoritesService } from './favorites.service'

@Module({
	imports: [PrismaModule, UserModule],
	controllers: [FavoritesController],
	providers: [FavoritesService],
	exports: [FavoritesService]
})
export class FavoritesModule {}
