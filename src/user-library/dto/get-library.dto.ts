import { MediaSource, Status } from '@prisma/client'
import { Transform, Type } from 'class-transformer'
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator'

export class GetLibraryDto {
	@IsOptional()
	@Transform(({ value }) =>
		value === undefined ? undefined : Array.isArray(value) ? value : [value]
	)
	@IsEnum(Status, { each: true })
	statuses?: Status[] // Масив статусів

	@IsOptional()
	@IsString()
	categoryName?: string // Для фільтрації за назвою категорії (Movies, Series, etc.)

	@IsOptional()
	@IsEnum(MediaSource)
	source?: MediaSource // Більше не фіксуємо TMDB за замовчуванням

	@IsOptional()
	@IsString()
	search?: string // Пошук за назвою

	@IsOptional()
	@Transform(({ value }) =>
		value === undefined ? undefined : Array.isArray(value) ? value : [value]
	)
	@IsString({ each: true })
	genres?: string[] // Фільтрація за жанрами

	@IsOptional()
	@IsNumber()
	@Min(1)
	@Type(() => Number)
	minRating?: number // Мінімальний рейтинг для фільтрації

	@IsOptional()
	@IsNumber()
	@Min(1)
	@Type(() => Number)
	maxRating?: number // Максимальний рейтинг для фільтрації

	@IsOptional()
	@IsNumber()
	@Min(1900)
	@Type(() => Number)
	minYear?: number // Мінімальний рік випуску

	@IsOptional()
	@IsNumber()
	@Min(1900)
	@Type(() => Number)
	maxYear?: number // Максимальний рік випуску

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
	sortBy?: string = 'addedAt' // addedAt, rating, title, year

	@IsOptional()
	@IsEnum(['asc', 'desc'])
	sortOrder?: 'asc' | 'desc' = 'desc'
}
