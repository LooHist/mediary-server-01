import { MediaSource } from '@prisma/client'
import { Type } from 'class-transformer'
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator'

export class FindMediaDto {
	@IsOptional()
	@IsString()
	search?: string

	@IsOptional()
	@IsString()
	collectionId?: string

	@IsOptional()
	@IsEnum(MediaSource)
	source?: MediaSource

	@IsOptional()
	@IsNumber()
	@Min(1900)
	@Type(() => Number)
	year?: number

	@IsOptional()
	@IsNumber()
	@Min(1)
	@Type(() => Number)
	page?: number = 1

	@IsOptional()
	@IsNumber()
	@Min(1)
	@Type(() => Number)
	limit?: number = 20

	@IsOptional()
	@IsString()
	sortBy?: string = 'createdAt'

	@IsOptional()
	@IsEnum(['asc', 'desc'])
	sortOrder?: 'asc' | 'desc' = 'desc'
}
