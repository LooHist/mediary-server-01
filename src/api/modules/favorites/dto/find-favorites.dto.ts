import { Transform } from 'class-transformer'
import { IsNumber, IsOptional, IsString, Min } from 'class-validator'

export class FindFavoritesDto {
	@IsOptional()
	@IsString()
	search?: string

	@IsOptional()
	@IsString()
	collectionId?: string

	@IsOptional()
	@Transform(({ value }) => parseInt(value))
	@IsNumber()
	@Min(1)
	page?: number = 1

	@IsOptional()
	@Transform(({ value }) => parseInt(value))
	@IsNumber()
	@Min(1)
	limit?: number = 20

	@IsOptional()
	@IsString()
	sortBy?: string = 'createdAt'

	@IsOptional()
	@IsString()
	sortOrder?: 'asc' | 'desc' = 'desc'
}
