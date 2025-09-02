import { Module } from '@nestjs/common'

import { PrismaModule } from '../prisma/prisma.module'
import { UserModule } from '../user/user.module'

import { CategoryController } from './category.controller'
import { CategoryService } from './category.service'

@Module({
	imports: [PrismaModule, UserModule],
	controllers: [CategoryController],
	providers: [CategoryService],
	exports: [CategoryService]
})
export class CategoryModule {}
