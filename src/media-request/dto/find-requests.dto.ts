import { MediaSource, ModerationType } from '@prisma/client'
import { Type } from 'class-transformer'
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator'

export class FindRequestsDto {
	@IsOptional()
	@IsEnum(ModerationType)
	status?: ModerationType // Фільтрація за статусом

	@IsOptional()
	@IsEnum(MediaSource)
	source?: MediaSource = MediaSource.TMDB // За замовчуванням TMDB

	@IsOptional()
	@IsString()
	categoryId?: string // Фільтрація за категорією

	@IsOptional()
	@IsString()
	search?: string // Пошук за назвою медіа

	@IsOptional()
	@IsString()
	requestedById?: string // Фільтр за користувачем (для адмінів)

	@IsOptional()
	@IsString()
	moderatedById?: string // Фільтр за модератором

	@IsOptional()
	@IsNumber()
	@Min(1900)
	@Type(() => Number)
	year?: number // Рік випуску медіа

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
