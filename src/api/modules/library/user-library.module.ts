import { PrismaModule } from '@database/prisma'
import { Module } from '@nestjs/common'

import { UserCollectionsModule } from '../user-collections/user-collections.module'
import { UserModule } from '../users/user.module'

import { UserLibraryFilteringService } from './filtering'
import { UserLibraryGenresService } from './genres'
import { UserLibraryItemsService } from './library-items'
import { UserLibraryRecommendationsService } from './recommendations'
import { UserLibrarySortingService } from './sorting'
import { UserLibraryController } from './user-library.controller'
import { UserLibraryService } from './user-library.service'

@Module({
	imports: [PrismaModule, UserModule, UserCollectionsModule],
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
