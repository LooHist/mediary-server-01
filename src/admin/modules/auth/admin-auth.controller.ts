import {
	BadRequestException,
	Body,
	Controller,
	ForbiddenException,
	Get,
	HttpCode,
	HttpStatus,
	Post,
	Req,
	Res,
	UnauthorizedException
} from '@nestjs/common'
import { Request, Response } from 'express'

import { AdminAuthService, AdminLoginDto } from './admin-auth.service'

@Controller('admin/auth')
export class AdminAuthController {
	constructor(private readonly adminAuthService: AdminAuthService) {}

	@Post('login')
	@HttpCode(HttpStatus.OK)
	public async login(
		@Req() req: Request,
		@Res() res: Response,
		@Body() dto: AdminLoginDto
	) {
		const isAdminRequest = req.headers['x-admin-panel'] === 'true'
		if (!isAdminRequest) {
			throw new ForbiddenException('Access denied: Admin panel required')
		}

		try {
			const user = await this.adminAuthService.validateAdminCredentials(
				dto.email,
				dto.password
			)

			const sessionId =
				await this.adminAuthService.createAdminSession(user)

			res.cookie('admin-session', sessionId, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite:
					process.env.NODE_ENV === 'production' ? 'none' : 'lax',
				domain: process.env.COOKIE_DOMAIN || undefined,
				maxAge: 2 * 60 * 60 * 1000
			})

			const { password, ...safeUser } = user
			return res.json({ user: safeUser })
		} catch (error) {
			const message = error.message || 'Login failed'

			if (message.includes('not found')) {
				throw new BadRequestException(message)
			} else if (message.includes('Invalid password')) {
				throw new UnauthorizedException(message)
			} else if (
				message.includes('do not have access') ||
				message.includes('no rights')
			) {
				throw new ForbiddenException(message)
			} else if (message.includes('not verified')) {
				throw new ForbiddenException(message)
			} else {
				throw new BadRequestException(message)
			}
		}
	}

	@Post('logout')
	@HttpCode(HttpStatus.OK)
	public async logout(@Req() req: Request, @Res() res: Response) {
		const sessionId = req.cookies['admin-session']

		if (sessionId) {
			await this.adminAuthService.deleteAdminSession(sessionId)
		}

		res.clearCookie('admin-session')
		return res.json({ success: true })
	}

	@Get('session')
	@HttpCode(HttpStatus.OK)
	public async getSession(@Req() req: Request) {
		const sessionId = req.cookies['admin-session']

		if (!sessionId) {
			throw new UnauthorizedException('No admin session')
		}

		try {
			const user =
				await this.adminAuthService.validateAdminSession(sessionId)
			const { password, ...safeUser } = user
			return { user: safeUser }
		} catch (error) {
			throw new UnauthorizedException(
				error.message || 'Invalid admin session'
			)
		}
	}

	@Post('refresh')
	@HttpCode(HttpStatus.OK)
	public async refreshSession(@Req() req: Request, @Res() res: Response) {
		const sessionId = req.cookies['admin-session']

		if (!sessionId) {
			throw new UnauthorizedException('No admin session')
		}

		try {
			const newSessionId =
				await this.adminAuthService.refreshAdminSession(sessionId)

			res.cookie('admin-session', newSessionId, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite:
					process.env.NODE_ENV === 'production' ? 'none' : 'lax',
				domain: process.env.COOKIE_DOMAIN || undefined,
				maxAge: 2 * 60 * 60 * 1000
			})

			return res.json({ success: true })
		} catch (error) {
			throw new UnauthorizedException(
				error.message || 'Failed to refresh session'
			)
		}
	}
}
