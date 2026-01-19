import { MediaSource } from '@prisma/client'
import {
	IsEnum,
	IsNotEmpty,
	IsObject,
	IsOptional,
	IsString
} from 'class-validator'

export class CreateMediaRequestDto {
	@IsEnum(MediaSource)
	@IsOptional()
	source?: MediaSource = MediaSource.CUSTOM // Default CUSTOM for user requests

	@IsObject()
	@IsNotEmpty()
	mediaData: {
		title: string
		originalTitle?: string
		description: string
		year: number
		posterUrl?: string
		genres?: string[]
		rating?: number
		// Common fields for all media types
		releaseDate?: string // DD/MM/YYYY
		country?: string
		originalLanguage?: string
		// Additional fields specific to different media types
		customFields?: {
			// Movie fields
			director?: string[]
			cast?: string[]
			runtime?: number // minutes (duration from form)
			ageRating?: string
			budget?: string

			// Series fields
			seasons?: number
			episodes?: number
			episodeDuration?: number // minutes
			showrunner?: string
			startDate?: string // DD/MM/YYYY
			endDate?: string // DD/MM/YYYY
			adaptedFrom?: string

			// Book fields
			pages?: number
			format?: string
			series?: string
			volume?: string
			isbn?: string
			translator?: string
			publicationYear?: number

			// Game fields
			platform?: string[]
			developer?: string
			gameplayGenre?: string
			playtime?: number // hours
			metacriticId?: number
			steamId?: string
			dlc?: string

			// Manga/Manhwa fields
			artist?: string
			volumes?: number
			chapters?: number
			magazine?: string
			adaptation?: string
			colorType?: string

			// Common fields for different media types
			studio?: string // Movie, Series
			status?: string // Series, Manga
			author?: string[] // Book, Manga
			publisher?: string // Book, Game

			[key: string]: any
		}
	}

	@IsString()
	@IsNotEmpty()
	categoryId: string // Category (Movies/Series/etc.)
}
