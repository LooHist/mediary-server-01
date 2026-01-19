import { MediaSource, Status } from '@prisma/client'
import { Transform, Type } from 'class-transformer'
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator'

export class GetLibraryDto {
	@IsOptional()
	@Transform(({ value }) =>
		value === undefined ? undefined : Array.isArray(value) ? value : [value]
	)
	@IsEnum(Status, { each: true })
	statuses?: Status[] // Array of statuses

	@IsOptional()
	@IsString()
	categoryName?: string // For filtering by category name (Movies, Series, etc.)

	@IsOptional()
	@IsEnum(MediaSource)
	source?: MediaSource // No longer defaulting to TMDB

	@IsOptional()
	@IsString()
	search?: string // Search by title

	@IsOptional()
	@Transform(({ value }) =>
		value === undefined ? undefined : Array.isArray(value) ? value : [value]
	)
	@IsString({ each: true })
	genres?: string[] // Filter by genres

	@IsOptional()
	@IsNumber()
	@Min(1)
	@Type(() => Number)
	minRating?: number // Minimum rating for filtering

	@IsOptional()
	@IsNumber()
	@Min(1)
	@Type(() => Number)
	maxRating?: number // Maximum rating for filtering

	@IsOptional()
	@IsNumber()
	@Min(1900)
	@Type(() => Number)
	minYear?: number // Minimum release year

	@IsOptional()
	@IsNumber()
	@Min(1900)
	@Type(() => Number)
	maxYear?: number // Maximum release year

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
	sortBy?: string = 'addedAt' // addedAt, rating, title, releaseYear, favorites

	@IsOptional()
	@IsEnum(['asc', 'desc'])
	sortOrder?: 'asc' | 'desc' = 'desc'
}
