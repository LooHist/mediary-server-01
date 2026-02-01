import { PrismaModule } from '@database/prisma'
import { Module } from '@nestjs/common'

import { UserModule } from '../users/user.module'

import { CollectionController } from './collection.controller'
import { CollectionService } from './collection.service'

@Module({
	imports: [PrismaModule, UserModule],
	controllers: [CollectionController],
	providers: [CollectionService],
	exports: [CollectionService]
})
export class CollectionModule {}




