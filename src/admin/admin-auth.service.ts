import { Injectable } from '@nestjs/common'
import { UserRole } from '@prisma/client'
import { verify } from 'argon2'
import { randomBytes } from 'crypto'
import IORedis from 'ioredis'

import { UserService } from '@/user/user.service'

export interface AdminLoginDto {
	email: string
	password: string
}

export interface AdminSessionData {
	userId: string
	role: UserRole
	email: string
	createdAt: string
}

@Injectable()
export class AdminAuthService {
	private redis: IORedis

	constructor(private readonly userService: UserService) {
		this.redis = new IORedis(
			process.env.REDIS_URI || 'redis://localhost:6379'
		)

		this.redis.on('error', error => {
			console.error('Redis connection error:', error)
		})

		this.redis.on('connect', () => {
			console.log('Redis connected for admin sessions')
		})
	}

	async validateAdminCredentials(email: string, password: string) {
		const user = await this.userService.findByEmail(email)

		if (!user || !user.password) {
			throw new Error('Admin not found. Please check your email.')
		}

		const isValidPassword = await verify(user.password, password)

		if (!isValidPassword) {
			throw new Error('Invalid password. Please try again.')
		}

		if (user.role !== UserRole.ADMIN && user.role !== UserRole.MODERATOR) {
			throw new Error('You do not have access to the admin panel.')
		}

		if (!user.isVerified) {
			throw new Error('Email not verified. Please check your email.')
		}

		return user
	}

	async createAdminSession(user: any): Promise<string> {
		const sessionId = this.generateSessionId()
		const sessionData: AdminSessionData = {
			userId: user.id,
			role: user.role,
			email: user.email,
			createdAt: new Date().toISOString()
		}

		await this.saveAdminSession(sessionId, sessionData)
		return sessionId
	}

	async getAdminSession(sessionId: string): Promise<AdminSessionData | null> {
		try {
			const key = `admin-session:${sessionId}`
			const data = await this.redis.get(key)
			return data ? JSON.parse(data) : null
		} catch (error) {
			console.error('Failed to get admin session:', error)
			return null
		}
	}

	async deleteAdminSession(sessionId: string): Promise<void> {
		try {
			const key = `admin-session:${sessionId}`
			await this.redis.del(key)
			console.log(`Admin session deleted: ${sessionId}`)
		} catch (error) {
			console.error('Failed to delete admin session:', error)
		}
	}

	async validateAdminSession(sessionId: string) {
		const sessionData = await this.getAdminSession(sessionId)

		if (!sessionData) {
			throw new Error('Invalid admin session')
		}

		const key = `admin-session:${sessionId}`
		const ttl = await this.redis.ttl(key)

		if (ttl <= 0) {
			await this.deleteAdminSession(sessionId)
			throw new Error('Session expired')
		}

		const user = await this.userService.findById(sessionData.userId)

		if (
			!user ||
			(user.role !== UserRole.ADMIN && user.role !== UserRole.MODERATOR)
		) {
			throw new Error('Access denied')
		}

		return user
	}

	async refreshAdminSession(sessionId: string): Promise<string> {
		const sessionData = await this.getAdminSession(sessionId)

		if (!sessionData) {
			throw new Error('Invalid admin session')
		}

		const key = `admin-session:${sessionId}`
		const ttl = await this.redis.ttl(key)

		if (ttl <= 0) {
			await this.deleteAdminSession(sessionId)
			throw new Error('Session expired')
		}

		const user = await this.userService.findById(sessionData.userId)

		if (
			!user ||
			(user.role !== UserRole.ADMIN && user.role !== UserRole.MODERATOR)
		) {
			throw new Error('Access denied')
		}

		const newSessionId = await this.createAdminSession(user)

		await this.deleteAdminSession(sessionId)

		return newSessionId
	}

	private generateSessionId(): string {
		return randomBytes(32).toString('hex')
	}

	private async saveAdminSession(
		sessionId: string,
		data: AdminSessionData
	): Promise<void> {
		try {
			const key = `admin-session:${sessionId}`
			await this.redis.setex(key, 7200, JSON.stringify(data))
			console.log(`Admin session saved: ${sessionId}`)
		} catch (error) {
			console.error('Failed to save admin session:', error)
			throw new Error('Failed to save admin session')
		}
	}
}
