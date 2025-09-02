import { Type } from 'class-transformer'
import { IsNumber, IsOptional, IsString, Min } from 'class-validator'

export class FindCategoriesDto {
	@IsOptional()
	@IsString()
	search?: string // Пошук за назвою категорії

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
	sortBy?: string = 'name' // name, createdAt, mediaCount

	@IsOptional()
	@IsString()
	sortOrder?: 'asc' | 'desc' = 'asc'
}
