import { Controller, Get, Req, UseGuards } from '@nestjs/common'

import { AdminAuthGuard } from './guards/admin-auth.guard'
import { AuthenticatedRequest } from './types/admin-auth.types'

@Controller('admin/dashboard')
@UseGuards(AdminAuthGuard)
export class AdminDashboardController {
	@Get()
	getDashboard(@Req() req: AuthenticatedRequest) {
		const user = req.user!

		return {
			user: {
				id: user.id,
				email: user.email,
				role: user.role,
				displayName: user.displayName
			},
			stats: {
				totalUsers: 1234,
				activeSessions: 567,
				pendingRequests: 23
			},
			timestamp: new Date().toISOString()
		}
	}

	@Get('users')
	getUsers(@Req() req: AuthenticatedRequest) {
		return {
			message: `Admin ${req.user!.email} accessing users`,
			users: []
		}
	}
}
