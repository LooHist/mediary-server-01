import { Module } from '@nestjs/common'

import { UserModule } from '@/user/user.module'

import { AdminAuthController } from './admin-auth.controller'
import { AdminAuthService } from './admin-auth.service'
import { AdminDashboardController } from './admin-dashboard.controller'
import { AdminAuthGuard } from './guards/admin-auth.guard'

@Module({
	imports: [UserModule],
	controllers: [AdminAuthController, AdminDashboardController],
	providers: [AdminAuthService, AdminAuthGuard],
	exports: [AdminAuthService, AdminAuthGuard]
})
export class AdminModule {}
