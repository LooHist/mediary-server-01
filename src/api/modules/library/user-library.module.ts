import { PrismaModule } from '@database/prisma'
import { Module } from '@nestjs/common'

import { UserCategoriesModule } from '../user-categories/user-categories.module'
import { UserModule } from '../users/user.module'

import { UserLibraryFilteringService } from './filtering'
import { UserLibraryGenresService } from './genres'
import { UserLibraryItemsService } from './library-items'
import { UserLibraryRecommendationsService } from './recommendations'
import { UserLibrarySortingService } from './sorting'
import { UserLibraryController } from './user-library.controller'
import { UserLibraryService } from './user-library.service'

@Module({
	imports: [PrismaModule, UserModule, UserCategoriesModule],
	controllers: [UserLibraryController],
	providers: [
		UserLibraryService,
		UserLibrarySortingService,
		UserLibraryGenresService,
		UserLibraryItemsService,
		UserLibraryRecommendationsService,
		UserLibraryFilteringService
	],
	exports: [UserLibraryService]
})
export class UserLibraryModule {}
