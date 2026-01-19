import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService
	extends PrismaClient
	implements OnModuleInit, OnModuleDestroy
{
	constructor(configService: ConfigService) {
		const connectionString = configService.getOrThrow<string>('POSTGRES_URI')
		// Connection string is read from POSTGRES_URI env var
		// PrismaClient reads DATABASE_URL from process.env automatically
		// Must set DATABASE_URL before super() call
		process.env.DATABASE_URL = connectionString
		super({})
	}

	public async onModuleInit(): Promise<void> {
		await this.$connect()
	}

	public async onModuleDestroy(): Promise<void> {
		await this.$disconnect()
	}
}