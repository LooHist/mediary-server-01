import { Module } from '@nestjs/common'

import { CategoryModule } from '../category/category.module'
import { PrismaModule } from '../prisma/prisma.module'
import { UserModule } from '../user/user.module'

import { UserCategoriesController } from './user-categories.controller'
import { UserCategoriesService } from './user-categories.service'

@Module({
	imports: [PrismaModule, CategoryModule, UserModule],
	controllers: [UserCategoriesController],
	providers: [UserCategoriesService],
	exports: [UserCategoriesService]
})
export class UserCategoriesModule {}
