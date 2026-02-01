import { Module } from '@nestjs/common'

// Import all API modules
import { AuthModule } from './modules/auth/auth.module'
import { CollectionModule } from './modules/collections/collection.module'
import { FavoritesModule } from './modules/favorites/favorites.module'
import { ImageModule } from './modules/image/image.module'
import { UserLibraryModule } from './modules/library/user-library.module'
import { MediaRequestModule } from './modules/media-requests/media-request.module'
import { MediaModule } from './modules/media/media.module'
import { SearchModule } from './modules/search/search.module'
import { UserCollectionsModule } from './modules/user-collections/user-collections.module'
import { UserModule } from './modules/users/user.module'

@Module({
	imports: [
		AuthModule,
		UserModule,
		MediaModule,
		UserLibraryModule,
		CollectionModule,
		UserCollectionsModule,
		MediaRequestModule,
		FavoritesModule,
		ImageModule,
		SearchModule
	],
	exports: [
		AuthModule,
		UserModule,
		MediaModule,
		UserLibraryModule,
		CollectionModule,
		UserCollectionsModule,
		MediaRequestModule,
		FavoritesModule,
		ImageModule,
		SearchModule
	]
})
export class ApiModule {}
