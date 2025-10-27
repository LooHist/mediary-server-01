import { UserModule } from '@api/modules/users/user.module'
import { Module } from '@nestjs/common'

import { AdminAuthController } from './admin-auth.controller'
import { AdminAuthGuard } from './admin-auth.guard'
import { AdminAuthService } from './admin-auth.service'

@Module({
	imports: [UserModule],
	controllers: [AdminAuthController],
	providers: [AdminAuthService, AdminAuthGuard],
	exports: [AdminAuthService, AdminAuthGuard]
})
export class AdminAuthModule {}
