import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { GoogleBooksService } from './google-books.service'
import { HttpRetryService } from './http-retry.service'
import { TMDBService } from './tmdb.service'

@Module({
	imports: [ConfigModule],
	providers: [TMDBService, GoogleBooksService, HttpRetryService],
	exports: [TMDBService, GoogleBooksService, HttpRetryService]
})
export class ExternalModule {}
