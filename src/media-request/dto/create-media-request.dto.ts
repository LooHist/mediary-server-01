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
	source?: MediaSource = MediaSource.TMDB // За замовчуванням TMDB для фільмів/серіалів

	@IsString()
	@IsOptional()
	externalId?: string // ID з TMDB або іншого API

	@IsObject()
	@IsNotEmpty()
	mediaData: {
		title: string
		originalTitle?: string
		description: string
		year: number
		posterUrl?: string
		// Додаткові поля специфічні для різних типів медіа
		customFields?: {
			// Для фільмів/серіалів (TMDB)
			director?: string[]
			cast?: string[]
			genres?: string[]
			runtime?: number // хвилини
			// TODO: Розширити для інших типів медіа
			// Для книг (Google Books):
			// author?: string[];
			// publisher?: string;
			// isbn?: string;
			// pageCount?: number;
			// Для аніме/манги (MAL):
			// studio?: string;
			// episodes?: number;
			// chapters?: number;
			[key: string]: any
		}
	}

	@IsString()
	@IsNotEmpty()
	categoryId: string // Категорія (Фільми/Серіали/тощо)

	@IsString()
	@IsOptional()
	comment?: string // Коментар від користувача чому хоче додати це медіа
}
