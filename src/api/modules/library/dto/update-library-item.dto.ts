import { Status } from '@prisma/client'
import {
	IsEnum,
	IsNumber,
	IsOptional,
	IsString,
	Max,
	MaxLength,
	Min
} from 'class-validator'

export class UpdateLibraryItemDto {
	@IsEnum(Status)
	@IsOptional()
	status?: Status

	@IsNumber({}, { message: 'Rating must be a number' })
	@IsOptional()
	@Min(1, { message: 'Rating must be at least 1' })
	@Max(10, { message: 'Rating must be at most 10' })
	rating?: number // Rating from 1 to 10

	@IsString()
	@IsOptional()
	@MaxLength(500)
	notes?: string
}
