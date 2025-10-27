import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator'

export class CreateCategoryDto {
	@IsString()
	@IsNotEmpty()
	@MinLength(2, {
		message: 'Назва категорії повинна містити мінімум 2 символи'
	})
	@MaxLength(50, {
		message: 'Назва категорії не може перевищувати 50 символів'
	})
	name: string
}
