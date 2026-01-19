import { ModerationType } from '@prisma/client'
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class ModerateRequestDto {
	@IsEnum(ModerationType)
	@IsNotEmpty()
	status: ModerationType // APPROVED or REJECTED

	@IsString()
	@IsOptional()
	moderatorNote?: string // Moderator note (especially important when rejecting)
}
