import { Module } from '@nestjs/common'

import { PrismaModule } from '../prisma/prisma.module'
import { UserModule } from '../user/user.module'

import { UserLibraryController } from './user-library.controller'
import { UserLibraryService } from './user-library.service'

@Module({
	imports: [PrismaModule, UserModule],
	controllers: [UserLibraryController],
	providers: [UserLibraryService],
	exports: [UserLibraryService]
})
export class UserLibraryModule {}
