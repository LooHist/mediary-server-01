import { PrismaModule } from '@database/prisma'
import { Module } from '@nestjs/common'

import { CollectionModule } from '../collections/collection.module'
import { UserModule } from '../users/user.module'

import { UserCollectionsController } from './user-collections.controller'
import { UserCollectionsService } from './user-collections.service'

@Module({
	imports: [PrismaModule, CollectionModule, UserModule],
	controllers: [UserCollectionsController],
	providers: [UserCollectionsService],
	exports: [UserCollectionsService]
})
export class UserCollectionsModule {}




