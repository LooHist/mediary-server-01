import { MediaSource } from '@prisma/client'
import {
	IsEnum,
	IsNotEmpty,
	IsObject,
	IsOptional,
	IsString
} from 'class-validator'

export class CreateMediaDto {
	@IsEnum(MediaSource)
	@IsOptional()
	source?: MediaSource = MediaSource.CUSTOM

	@IsString()
	@IsOptional()
	externalId?: string

	@IsObject()
	@IsNotEmpty()
	mediaData: {
		title: string
		originalTitle?: string
		description: string
		year: number
		posterUrl?: string
		addedBy?: string
		isVerified?: boolean
		customFields?: {
			author?: string[]
			director?: string[]
			publisher?: string
			isbn?: string
			[key: string]: any
		}
	}

	@IsString()
	@IsNotEmpty()
	categoryId: string

	@IsString()
	@IsOptional()
	addedById?: string
}
