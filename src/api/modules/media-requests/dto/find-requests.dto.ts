import { MediaSource, ModerationType } from '@prisma/client'
import { Type } from 'class-transformer'
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator'

export class FindRequestsDto {
	@IsOptional()
	@IsEnum(ModerationType)
	status?: ModerationType // Filter by status

	@IsOptional()
	@IsEnum(MediaSource)
	source?: MediaSource = MediaSource.TMDB // Default TMDB

	@IsOptional()
	@IsString()
	collectionId?: string // Filter by collection

	@IsOptional()
	@IsString()
	search?: string // Search by media title

	@IsOptional()
	@IsString()
	requestedById?: string // Filter by user (for admins)

	@IsOptional()
	@IsString()
	moderatedById?: string // Filter by moderator

	@IsOptional()
	@IsNumber()
	@Min(1900)
	@Type(() => Number)
	year?: number // Media release year

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
	sortBy?: string = 'createdAt' // createdAt, updatedAt, title

	@IsOptional()
	@IsEnum(['asc', 'desc'])
	sortOrder?: 'asc' | 'desc' = 'desc'
}
