import { ModerationType } from '@prisma/client'
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class ModerateRequestDto {
	@IsEnum(ModerationType)
	@IsNotEmpty()
	status: ModerationType // APPROVED або REJECTED

	@IsString()
	@IsOptional()
	moderatorNote?: string // Нотатка модератора (особливо важливо при відхиленні)
}
