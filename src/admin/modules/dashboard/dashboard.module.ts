import { Module } from '@nestjs/common'

import { AdminAuthModule } from '../auth/admin-auth.module'

import { AdminDashboardController } from './admin-dashboard.controller'

@Module({
	imports: [AdminAuthModule],
	controllers: [AdminDashboardController]
})
export class AdminDashboardModule {}
