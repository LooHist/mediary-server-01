import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { AuthModule } from './auth/auth.module'
import { EmailConfirmationModule } from './auth/email-confirmation/email-confirmation.module'
import { PasswordRecoveryModule } from './auth/password-recovery/password-recovery.module'
import { ProviderModule } from './auth/provider/provider.module'
import { TwoFactorAuthModule } from './auth/two-factor-auth/two-factor-auth.module'
import { CategoryModule } from './category/category.module'
import { ExternalModule } from './external/external.module'
import { ImageModule } from './image/image.module'
import { IS_DEV_ENV } from './libs/common/utils/is-dev.util'
import { MailModule } from './libs/mail/mail.module'
import { MediaRequestModule } from './media-request/media-request.module'
import { MediaModule } from './media/media.module'
import { PrismaModule } from './prisma/prisma.module'
import { SearchModule } from './search/search.module'
import { UserLibraryModule } from './user-library/user-library.module'
import { UserModule } from './user/user.module'

@Module({
	imports: [
		ConfigModule.forRoot({
			ignoreEnvFile: !IS_DEV_ENV,
			isGlobal: true
		}),
		PrismaModule,
		AuthModule,
		UserModule,
		ProviderModule,
		MailModule,
		EmailConfirmationModule,
		PasswordRecoveryModule,
		TwoFactorAuthModule,
		MediaModule,
		UserLibraryModule,
		CategoryModule,
		MediaRequestModule,
		ImageModule,
		SearchModule,
		ExternalModule
	]
})
export class AppModule {}
