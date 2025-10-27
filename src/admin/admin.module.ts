import { Module } from '@nestjs/common'

import { AdminAuthModule } from './modules/auth/admin-auth.module'
import { AdminDashboardModule } from './modules/dashboard/dashboard.module'

@Module({
	imports: [AdminAuthModule, AdminDashboardModule],
	exports: [AdminAuthModule]
})
export class AdminModule {}
