import { UserService } from '@api/modules/users/user.service'
import { MailModule } from '@infrastructure/mail'
import { MailService } from '@infrastructure/mail'
import { forwardRef, Module } from '@nestjs/common'

import { AuthModule } from '../auth.module'

import { EmailConfirmationController } from './email-confirmation.controller'
import { EmailConfirmationService } from './email-confirmation.service'

@Module({
	imports: [MailModule, forwardRef(() => AuthModule)],
	controllers: [EmailConfirmationController],
	providers: [EmailConfirmationService, UserService, MailService],
	exports: [EmailConfirmationService]
})
export class EmailConfirmationModule {}
