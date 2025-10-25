import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException
} from '@nestjs/common'

import { AdminAuthService } from '../admin-auth.service'
import { AuthenticatedRequest } from '../types/admin-auth.types'

@Injectable()
export class AdminAuthGuard implements CanActivate {
	constructor(private readonly adminAuthService: AdminAuthService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context
			.switchToHttp()
			.getRequest<AuthenticatedRequest>()
		const sessionId = request.cookies['admin-session']

		if (!sessionId) {
			throw new UnauthorizedException('No admin session')
		}

		try {
			const user =
				await this.adminAuthService.validateAdminSession(sessionId)
			request.user = user
			return true
		} catch (error) {
			throw new UnauthorizedException(
				error.message || 'Invalid admin session'
			)
		}
	}
}
