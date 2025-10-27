import { UserService } from '@api/modules/users/user.service'
import { MailService } from '@infrastructure/mail'
import { Module } from '@nestjs/common'

import { PasswordRecoveryController } from './password-recovery.controller'
import { PasswordRecoveryService } from './password-recovery.service'

@Module({
	controllers: [PasswordRecoveryController],
	providers: [PasswordRecoveryService, UserService, MailService]
})
export class PasswordRecoveryModule {}
