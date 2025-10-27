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
		// Connection string is read from POSTGRES_URI env var (configured in schema.prisma for migrations)
		// PrismaClient uses standard initialization with connection from environment
		super()
	}

	public async onModuleInit(): Promise<void> {
		await this.$connect()
	}

	public async onModuleDestroy(): Promise<void> {
		await this.$disconnect()
	}
}