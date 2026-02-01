import { AllExceptionsFilter, PrismaExceptionFilter } from '@common/filters'
import { createRedisClient, ms, parseBoolean, StringValue } from '@common/utils'
import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import RedisStore from 'connect-redis'
import * as cookieParser from 'cookie-parser'
import * as session from 'express-session'

import { AppModule } from './app.module'

async function bootstrap() {
	const app = await NestFactory.create(AppModule)

	const config = app.get(ConfigService)
	// Use REDIS_URI if available, otherwise createRedisClient will use separate env variables
	const redisUri = config.get<string>('REDIS_URI') || 'redis://localhost:6379'
	const redis = createRedisClient(redisUri)

	app.use(cookieParser(config.getOrThrow<string>('COOKIES_SECRET')))

	// Global exception filters
	app.useGlobalFilters(new AllExceptionsFilter(), new PrismaExceptionFilter())

	// Global pipes
	app.useGlobalPipes(
		new ValidationPipe({
			transform: true,
			whitelist: true,
			forbidNonWhitelisted: true
		})
	)

	app.use(
		session({
			secret: config.getOrThrow<string>('SESSION_SECRET'),
			name: config.getOrThrow<string>('SESSION_NAME'),
			resave: true,
			saveUninitialized: false,
			cookie: {
				domain: config.getOrThrow<string>('SESSION_DOMAIN'),
				maxAge: ms(config.getOrThrow<StringValue>('SESSION_MAX_AGE')),
				httpOnly: parseBoolean(
					config.getOrThrow<string>('SESSION_HTTP_ONLY')
				),
				secure: parseBoolean(
					config.getOrThrow<string>('SESSION_SECURE')
				),
				sameSite: 'lax'
			},
			store: new RedisStore({
				client: redis,
				prefix: config.getOrThrow<string>('SESSION_FOLDER')
			})
		})
	)

	app.enableCors({
		origin: [
			config.getOrThrow<string>('FRONTEND_URL'),
			config.getOrThrow<string>('ADMIN_URL')
		],
		credentials: true,
		exposedHeaders: ['set-cookie']
	})

	await app.listen(config.getOrThrow<number>('APPLICATION_PORT'))
}

bootstrap()
