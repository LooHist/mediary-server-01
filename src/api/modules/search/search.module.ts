import { ExternalModule } from '@core/external'
import { PrismaModule } from '@database/prisma'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { ImageModule } from '../image/image.module'
import { MediaModule } from '../media/media.module'
import { UserModule } from '../users/user.module'

import { SearchController } from './search.controller'
import { SearchService } from './search.service'

@Module({
	imports: [
		ConfigModule,
		ExternalModule,
		MediaModule,
		ImageModule,
		PrismaModule,
		UserModule
	],
	controllers: [SearchController],
	providers: [SearchService],
	exports: [SearchService]
})
export class SearchModule {}
