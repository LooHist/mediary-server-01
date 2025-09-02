import { IsObject, IsOptional, IsString } from 'class-validator'

export class UpdateRequestDto {
	@IsObject()
	@IsOptional()
	mediaData?: {
		title?: string
		originalTitle?: string
		description?: string
		year?: number
		posterUrl?: string
		customFields?: {
			[key: string]: any
		}
	}

	@IsString()
	@IsOptional()
	comment?: string // Оновлення коментаря
}
