import { IsNotEmpty, IsString } from 'class-validator'

export class ConfirmationDto {
	@IsString({ message: 'Token must be a string.' })
	@IsNotEmpty({ message: 'Token field must not be empty.' })
	token: string
}
