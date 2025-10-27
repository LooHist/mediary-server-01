import { PrismaModule } from '@database/prisma'
import { Module } from '@nestjs/common'

import { CategoryModule } from '../categories/category.module'
import { UserModule } from '../users/user.module'

import { UserCategoriesController } from './user-categories.controller'
import { UserCategoriesService } from './user-categories.service'

@Module({
	imports: [PrismaModule, CategoryModule, UserModule],
	controllers: [UserCategoriesController],
	providers: [UserCategoriesService],
	exports: [UserCategoriesService]
})
export class UserCategoriesModule {}
