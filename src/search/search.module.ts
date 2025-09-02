import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { ExternalModule } from '../external/external.module'
import { ImageModule } from '../image/image.module'
import { MediaModule } from '../media/media.module'
import { PrismaModule } from '../prisma/prisma.module'
import { UserModule } from '../user/user.module'

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
