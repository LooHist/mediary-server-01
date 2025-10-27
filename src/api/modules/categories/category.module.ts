import { PrismaModule } from '@database/prisma'
import { Module } from '@nestjs/common'

import { UserModule } from '../users/user.module'

import { CategoryController } from './category.controller'
import { CategoryService } from './category.service'

@Module({
	imports: [PrismaModule, UserModule],
	controllers: [CategoryController],
	providers: [CategoryService],
	exports: [CategoryService]
})
export class CategoryModule {}
