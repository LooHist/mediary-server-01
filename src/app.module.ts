import { AdminModule } from '@admin/admin.module'
import { ApiModule } from '@api/api.module'
import { IS_DEV_ENV } from '@common/utils'
import { ExternalModule } from '@core/external'
import { PrismaModule } from '@database/prisma'
import { MailModule } from '@infrastructure/mail'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

@Module({
	imports: [
		ConfigModule.forRoot({
			ignoreEnvFile: !IS_DEV_ENV,
			isGlobal: true
		}),
		PrismaModule,
		MailModule,
		ExternalModule,
		ApiModule,
		AdminModule
	]
})
export class AppModule {}
