import { IsNotEmpty, IsString } from 'class-validator'

export class RemoveCategoryDto {
	@IsString()
	@IsNotEmpty()
	categoryId: string
}
