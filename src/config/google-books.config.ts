import { ConfigService } from '@nestjs/config'

export interface GoogleBooksConfig {
	apiKey: string
	baseUrl: string
	langRestrict: string
	printType: string
}

export const getGoogleBooksConfig = (
	configService: ConfigService
): GoogleBooksConfig => ({
	apiKey: configService.getOrThrow<string>('GOOGLE_BOOKS_API_KEY'),
	baseUrl:
		configService.get<string>('GOOGLE_BOOKS_BASE_URL') ||
		'https://www.googleapis.com/books/v1',
	langRestrict: configService.get<string>('GOOGLE_BOOKS_LANG') || 'en',
	printType: configService.get<string>('GOOGLE_BOOKS_PRINT_TYPE') || 'books'
})
