import { Status } from '@prisma/client'
import {
	IsEnum,
	IsNotEmpty,
	IsNumber,
	IsObject,
	IsOptional,
	IsString,
	Max,
	MaxLength,
	Min
} from 'class-validator'

export class AddFromSearchDto {
	@IsObject()
	@IsNotEmpty()
	searchResult: {
		id: string
		title: string
		subtitle?: string
		imageUrl?: string
		year?: string
		type: string
		source: string
		externalId?: string
		rating?: number
		genres?: string[]
	}

	@IsEnum(Status)
	@IsOptional()
	status?: Status = Status.IN_PROGRESS

	@IsNumber({}, { message: 'Rating must be a number' })
	@IsOptional()
	@Min(1, { message: 'Rating must be at least 1' })
	@Max(10, { message: 'Rating must be at most 10' })
	rating?: number

	@IsString()
	@IsOptional()
	@MaxLength(500)
	notes?: string
}
