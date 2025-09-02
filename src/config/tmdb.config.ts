import { ConfigService } from '@nestjs/config'

export interface TMDBConfig {
	apiKey: string
	baseUrl: string
	language: string
	enableFiltering: boolean
}

export const getTMDBConfig = (configService: ConfigService): TMDBConfig => ({
	apiKey: configService.getOrThrow<string>('TMDB_API_KEY'),
	baseUrl: 'https://api.themoviedb.org/3',
	language: configService.get<string>('TMDB_LANGUAGE') || 'en-US',
	enableFiltering: configService.get<boolean>('TMDB_ENABLE_FILTERING') ?? true
})
