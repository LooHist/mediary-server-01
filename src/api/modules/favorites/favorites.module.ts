import { PrismaModule } from '@database/prisma'
import { Module } from '@nestjs/common'

import { UserModule } from '../users/user.module'

import { FavoritesController } from './favorites.controller'
import { FavoritesService } from './favorites.service'

@Module({
	imports: [PrismaModule, UserModule],
	controllers: [FavoritesController],
	providers: [FavoritesService],
	exports: [FavoritesService]
})
export class FavoritesModule {}
