import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { GoogleBooksService } from './google-books.service'
import { TMDBService } from './tmdb.service'
import { HttpRetryService } from './utils/http-retry.service'

@Module({
	imports: [ConfigModule],
	providers: [TMDBService, GoogleBooksService, HttpRetryService],
	exports: [TMDBService, GoogleBooksService, HttpRetryService]
})
export class ExternalModule {}
