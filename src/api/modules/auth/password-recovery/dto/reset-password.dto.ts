import { IsEmail, IsNotEmpty } from 'class-validator'

export class ResetPasswordDto {
	@IsEmail({}, { message: 'Please enter a valid email address.' })
	@IsNotEmpty({ message: 'Email field must not be empty.' })
	email: string
}
